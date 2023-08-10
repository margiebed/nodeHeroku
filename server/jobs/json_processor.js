const fs = require("fs");
const axios = require("axios");
var Queue = require("bull");
const redis = require("redis");
const client = redis.createClient();
var FormData = require("form-data");
const fsExtra = require("fs-extra");

var JsonProcessor = new Queue("json_processor", "redis://127.0.0.1:6379");

JsonProcessor.process(async function (job, done) {
  let filepath, email, token, project_id;

  client.get(job.data.cache_key, async (err, result) => {
    if (!result) return;

    const obj = JSON.parse(result.toString());

    filepath = obj.filepath;
    email = obj.email;
    token = obj.token;
    project_id = obj.project_id;

    await startImport();
  });

  const authHeaders = () => ({
    "Content-Type": "application/json",
    "X-User-Email": email,
    "X-User-Token": token,
  });

  const startImport = async () => {
    console.log("==== Import started ====");
    console.log(new Date().toISOString(), "project_id:", project_id, email);

    const data = fs.readFileSync(filepath);
    const jsonData = JSON.parse(data);

    // Drawings
    for (let e of jsonData.slides) {
      if (e.slideType !== "floorplan" || !e.floorplanDetails) {
        continue;
      }
      const drawing_name = e.slideName;
      const floorplan_url = e.floorplanDetails.url;
      const drawing_sid = e.sId;

      const drawing = await upload_drawing(
        project_id,
        drawing_sid,
        drawing_name,
        floorplan_url
      );

      let slideNodes = [];
      if (!e.slideNodes && e.slideNodesUrl) {
        slideNodes = await fetch_slide_nodes_data(e.slideNodesUrl);
      } else {
        slideNodes = e.slideNodes || [];
      }

      const pins = slideNodes.filter(ee => !!ee.markerV3).map((t) => ({
        url: t.markerV3.originImageUrl,
        filename: t.markerV3.name || ("img" + t.sId + ".jpg"),
        sId: t.sId,
        timestamp: t.timeStamp,
        // type: t.markerType,
        photos: t.slideNodes.filter(ee => !!ee.markerV3).map(t2 => ({
          url: t2.markerV3.originImageUrl,
          filename: t2.markerV3.name || ("img" + t2.sId + ".jpg"),
          sId: t2.sId,
          timestamp: t2.timeStamp,
        }))
      }));

      const positions = e.floorplanDetails.hotspotsV2 || [];
      await create_pins(drawing.id, pins, positions);

      await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 sec

      await emptyImageDirectory();
    }

    console.log("==== Import Finished ====");
    done();
  };

  const fetch_slide_nodes_data = async (url) => {
    const response = await axios.get(url);
    return response.data.slideNodes;
  }

  const upload_drawing = async (project_id, drawing_sid, name, url) => {
    const temp_image_path = `image_files/temp-${drawing_sid}.jpeg`;
    await download_image(url, temp_image_path);

    var formData = new FormData();
    formData.append("area[name]", name);
    formData.append("area[project_id]", project_id);
    formData.append("area[floor_plan]", fs.createReadStream(temp_image_path));

    const config = {
      headers: {
        ...authHeaders(),
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    };

    try {
      const response = await axios.post("https://app.structionsite.com/api/v1/areas", formData, config);
      console.log("==== Drawing uploaded ====", response.data.id, response.data.name);
      return response.data;
    } catch (error) {
      console.log("Failed to upload the drawing:", project_id, name);
    }
  };

  const create_pins = async (drawing_id, pins, positions) => {
    for (let position of positions) {
      const pin = pins.find((e) => e.sId === position.sId);
      try {
        await create_pin(drawing_id, pin, position);
      } catch (e) {
        console.log("Failed to upload photo: sId=", position.sId, e);
      }
    }
  };

  const create_pin = async (drawing_id, pin, position) => {
    const data = {
      pin: {
        x: position.x,
        y: position.y,
        area_id: drawing_id,
        pin_images_attributes: [
          {
            taken_time: new Date(pin.timestamp).toISOString(),
            image_id: pin.filename || (pin.sId + ".jpeg"),
            image_type: "panoramic",
            rotation: 0,
          },
        ],
      },
    };
    const response = await axios.post("https://app.structionsite.com/api/v1/pins", data, { headers: authHeaders() });
    const newPin = response.data;
    console.log("==== pin created ====", newPin.id);

    upload_photo(pin.url, pin.sId, newPin.pin_images[0]);

    if (pin.photos.length > 0) {
      for (let photo of pin.photos) {
        const data2 = {
          pin_image: {
            pin_id: newPin.id,
            taken_time: new Date(photo.timestamp).toISOString(),
            image_id: photo.filename || (photo.sId + ".jpeg"),
            image_type: "panoramic",
            rotation: 0,
          },
        }
        const response2 = await axios.post("https://app.structionsite.com/api/v1/pin_image", data2, { headers: authHeaders() });

        upload_photo(photo.url, photo.sId, response2.data);
      }
    }
  };

  const upload_photo = async (url, sId, pin_image) => {
    const pin_image_id = pin_image.id;
    const s3_signed_url = pin_image.tmp_upload_url;
    const temp_image_path = `image_files/temp-photo-${sId}.jpeg`;
    await download_image(url, temp_image_path);

    await axios.put(s3_signed_url, fs.readFileSync(temp_image_path), { maxContentLength: Infinity, maxBodyLength: Infinity, headers: { "Content-Type": "image/jpeg" } });
    console.log("==== photo uploaded ====");
    await axios.post(`https://app.structionsite.com/api/v1/pin_images/${pin_image_id}/uploaded`, {}, { headers: authHeaders() });
  }

  const download_image = (url, image_path) => {
    const stream = fs.createWriteStream(image_path);
    return axios({
      url,
      responseType: "stream",
    }).then(
      (response) =>
        new Promise((resolve, reject) => {
          response.data
            .pipe(stream)
            .on("finish", () => {
              stream.end();
              resolve();
            })
            .on("error", (e) => {
              stream.end();
              reject(e);
            });
        })
    );
  };

  const emptyImageDirectory = async () => {
    await new Promise(resolve => setTimeout(resolve, 3000)); // sleep 3 sec

    fsExtra.emptyDirSync("image_files");
  }
});

module.exports = JsonProcessor;
