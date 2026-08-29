import { createServer } from "node:http";

const server = createServer((_request, response) => {
  response.writeHead(200, {
    "content-type": "application/json",
  });

  response.end(
    JSON.stringify({
      message: "Support Ticket API",
    }),
  );
});

const port = Number(process.env.PORT ?? 4000);

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});