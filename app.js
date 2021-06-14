const axios = require("axios");
const express = require("express");
const app = express();
const port = process.env.PORT || 3030;
const keys = require("./keys");

const http = require("https"); // or 'https' for https:// URLs
const fs = require("fs");

/* Azure Cognitive Services Variables */
const COGNITIVE_SERVICES_ENDPOINT =
  "https://c964-josh.cognitiveservices.azure.com/vision";
const FEATURES = "Adult,Categories,Description,Objects";
const DETAILS = "Celebrities";
let AZURE_API_KEY = keys.cognitiveServicesApiKey;
const AZURE_HEADERS = { "Ocp-Apim-Subscription-Key": AZURE_API_KEY };
const AZURE_FULL_URL = `${COGNITIVE_SERVICES_ENDPOINT}/v3.1/analyze?visualFeatures=${FEATURES}&details=${DETAILS}`;

/* 4chan API Variables */
const FOURCHAN_ENDPOINT = "https://a.4cdn.org/b/catalog.json";
const FOURCHAN_IMAGES_ENDPOINT = "https://i.4cdn.org/b/";
const FOURCHAN_MAX_PAGES = 9;
const FOURCHAN_MAX_THREADS_PER_PAGE = 14;

/* Enable ability to parse the body */
app.use(express.json());

/* Enable calls from other domains; instead of GET, change to [*] for all */
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET");
  next();
});

app.get("/", (req, res) => {
  res.send({ message: "What up, fam?" }).status(200);
});

app.get("/image", (req, res) => {
  /*
    Structure of Cognitive Services response
      response.data
      response.data.categories
      response.data.adult
      response.data.description
      response.data.description.captions
  */
  let uri = AZURE_FULL_URL;
  let body = { url: req.body.url };

  axios({
    method: "POST",
    headers: AZURE_HEADERS,
    url: AZURE_FULL_URL,
    data: body,
  })
    .then((response) => {
      res.send(response.data).status(200);
    })
    .catch((error) => {
      // Handle error
      res.send({ error: error.message, details: error }).status(500);
    });
});

app.get("/4chan", (req, res) => {
  /*
      4chan API docs: https://github.com/4chan/4chan-API/blob/master/pages/Endpoints_and_domains.md
      Image URL base: https://i.4cdn.org/b/
      Structure of 4chan API response
        response.data.length --> 10 (returns 10 pages)
        response.data[0].threads.length --> 15 (returns 15 threads per page)
        response.data[0].threads[0].tim + response.data[0].threads[0].ext --> filename.jpg (For example)
        Full Image URL: FOURCHAN_IMAGES_ENDPOINT + response.data[0].threads[0].tim + response.data[0].threads[0].ext
  */
  axios({
    method: "GET",
    url: FOURCHAN_ENDPOINT,
  })
    .then((response) => {
      let randomPage = Math.floor(Math.random() * FOURCHAN_MAX_PAGES);
      let randomThread = Math.floor(
        Math.random() * FOURCHAN_MAX_THREADS_PER_PAGE
      );

      /* Cognitive Services can't handle Webms and animated gifs */
      while (
        response.data[randomPage].threads[randomThread].ext === "webm" ||
        response.data[randomPage].threads[randomThread].ext === "gif"
      ) {
        randomPage = Math.floor(Math.random() * FOURCHAN_MAX_PAGES);
        randomThread = Math.floor(
          Math.random() * FOURCHAN_MAX_THREADS_PER_PAGE
        );
      }

      let random4chanImage =
        FOURCHAN_IMAGES_ENDPOINT +
        response.data[randomPage].threads[randomThread].tim +
        response.data[randomPage].threads[randomThread].ext;

      /* After retrieving a random image from 4chan, send it to Cognitive Services for Analysis */
      axios({
        method: "POST",
        headers: AZURE_HEADERS,
        url: AZURE_FULL_URL,
        data: { url: random4chanImage },
      })
        .then((response) => {
          /* Get the response from Cognitive Services and append the image URL */
          let cognitiveServicesResponse = response.data;
          cognitiveServicesResponse["imageurl"] = random4chanImage;

          // Send response back to the front end
          res.send(cognitiveServicesResponse).status(200);
        })
        .catch((azureError) => {
          res.send({
            error: azureError.message,
            details: azureError,
            platform: "azureapi",
          });
        });
      //res.send({ url: random4chanImage }).status(200);
    })
    .catch((error) => {
      // Handle error
      res
        .send({ error: error.message, details: error, platform: "4chanapi" })
        .status(500);
    });
});

app.get("/4chanraw", (req, res) => {
  /*
      4chan API docs: https://github.com/4chan/4chan-API/blob/master/pages/Endpoints_and_domains.md
      Image URL base: https://i.4cdn.org/b/
      Structure of 4chan API response
        response.data.length --> 10 (returns 10 pages)
        response.data[0].threads.length --> 15 (returns 15 threads per page)
        response.data[0].threads[0].tim + response.data[0].threads[0].ext --> filename.jpg (For example)
        Full Image URL: FOURCHAN_IMAGES_ENDPOINT + response.data[0].threads[0].tim + response.data[0].threads[0].ext
  */
  axios({
    method: "GET",
    url: FOURCHAN_ENDPOINT,
  })
    .then((response) => {
      let randomPage = Math.floor(Math.random() * FOURCHAN_MAX_PAGES);
      let randomThread = Math.floor(
        Math.random() * FOURCHAN_MAX_THREADS_PER_PAGE
      );

      /* Cognitive Services can't handle Webms and animated gifs */
      while (
        response.data[randomPage].threads[randomThread].ext === "webm" ||
        response.data[randomPage].threads[randomThread].ext === "gif"
      ) {
        randomPage = Math.floor(Math.random() * FOURCHAN_MAX_PAGES);
        randomThread = Math.floor(
          Math.random() * FOURCHAN_MAX_THREADS_PER_PAGE
        );
      }

      let random4chanImage =
        FOURCHAN_IMAGES_ENDPOINT +
        response.data[randomPage].threads[randomThread].tim +
        response.data[randomPage].threads[randomThread].ext;
      let imageName =
        response.data[randomPage].threads[randomThread].tim +
        response.data[randomPage].threads[randomThread].ext;

      //let random4chanImage = "https://i.imgur.com/X8hiPwF.jpg";

      /* After retrieving a random image from 4chan, send it to Cognitive Services for Analysis */
      axios({
        method: "POST",
        headers: AZURE_HEADERS,
        url: AZURE_FULL_URL,
        data: { url: random4chanImage },
      })
        .then((response) => {
          /* Get the response from Cognitive Services and append the image URL */
          let cognitiveServicesResponse = response.data;
          cognitiveServicesResponse["4chanimageurl"] = random4chanImage;
          cognitiveServicesResponse[
            "mirrorimageurl"
          ] = `https://c964imagemirrors.blob.core.windows.net/%24web/${imageName}`;

          /* Save the 4chan image locally */
          let writer = fs.createWriteStream(imageName).on("close", () => {
            /* Once the file has been saved locally, Upload a mirror to Azure Storage Account */
            uploadFileToBlob(imageName)
              .then((result) => {
                //console.log("result");
                //console.log(result);

                /* Once the file has been uploaded, send all data back to the front end */
                res
                  .send(cognitiveServicesResponse)
                  .status(200)
                  .on("finish", () => {
                    //console.log("I'm done lol");
                  });
              })
              .catch((error) => {
                console.log(error);
                /* If something messed up, send an error back */
                res.send(error).status(500);
              });

            /* After Image was sent to azure Storage, delete it locally and send new URL back to client */
          });

          axios({
            url: random4chanImage,
            method: "GET",
            responseType: "stream",
          }).then((response) => {
            response.data.pipe(writer);

            //cognitiveServicesResponse["imagedata"] = response.data;
            // Send response back to the front end
          });
        })
        .catch((azureError) => {
          res.send({
            error: azureError.message,
            details: azureError,
            platform: "azureapi",
          });
        });
      //res.send({ url: random4chanImage }).status(200);
    })
    .catch((error) => {
      // Handle error
      res
        .send({ error: error.message, details: error, platform: "4chanapi" })
        .status(500);
    });
});
app.listen(port, () => {
  //console.log(`Example app listening at http://localhost:${port}`);
});

const uploadFileToBlob = async (file) => {
  const { AbortController } = require("@azure/abort-controller");
  const {
    AnonymousCredential,
    BlobServiceClient,
    newPipeline,
  } = require("@azure/storage-blob");
  const account = "c964imagemirrors";
  const accountSas =
    "?sv=2020-02-10&ss=bfqt&srt=sco&sp=rwdlacuptfx&se=2024-06-11T11:58:46Z&st=2021-06-14T03:58:46Z&spr=https&sig=bkIfOKjsCEzHntdJpUd%2BpsSU4lnNA3Lmq1jwhAjzLn4%3D";
  const localFilePath = file;
  const pipeline = newPipeline(new AnonymousCredential(), {
    // httpClient: MyHTTPClient, // A customized HTTP client implementing IHttpClient interface
    retryOptions: { maxTries: 4 }, // Retry options
    userAgentOptions: { userAgentPrefix: "AdvancedSample V1.0.0" }, // Customized telemetry string
    keepAliveOptions: {
      // Keep alive is enabled by default, disable keep alive by setting false
      enable: false,
    },
  });
  const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net${accountSas}`,
    pipeline
  );
  const containerName = "$web";
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobName = file;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  //console.log("blockBlobClient", blockBlobClient);
  try {
    const result = await blockBlobClient.uploadFile(localFilePath, {
      blockSize: 4 * 1024 * 1024, // 4MB block size
      concurrency: 20, // 20 concurrency
      onProgress: (ev) => console.log(ev),
    });
    //console.log("uploadFile succeeds");
    return result;
  } catch (err) {
    //console.log(`uploadFile failed, requestId - ${err.details.requestId}, statusCode - ${err.statusCode}, errorCode - ${err.details.errorCode}`);
    throw err;
  }
};
