const k6 = require("k6");
const http = require("k6/http");

const url = "https://pulumi-az-webapp-demo-api-dev.azurewebsites.net/counter";

export const options = {
  stages: [{ duration: "15m", target: 1000 }],
};

export default function () {
  const res = http.post(url);
  k6.check(res, { "status was 200": (r) => r.status == 200 });
  k6.sleep(1);
}
