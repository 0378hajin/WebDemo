const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const host = "127.0.0.1";
const port = Number(process.env.PORT) || 8080;
const mimeTypes = {
    ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8",
    ".js":"application/javascript; charset=utf-8", ".json":"application/json; charset=utf-8",
    ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".svg":"image/svg+xml"
};

http.createServer((request, response) => {
    const requestPath = decodeURIComponent(request.url.split("?")[0]);
    const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        response.writeHead(404, { "Content-Type":"text/plain; charset=utf-8" });
        response.end("파일을 찾을 수 없습니다.");
        return;
    }
    response.writeHead(200, { "Content-Type":mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(response);
}).listen(port, host, () => console.log(`Portfolio demo: http://${host}:${port}`));
