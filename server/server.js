// Start the HTTP listener. app.js defines middleware/routes; this file chooses
// a port and makes that configured application accept network connections.
import app from "./app.js";

// Use PORT from the environment when deployed, or port 5000 for local work.
const port = Number(process.env.PORT || 5000);

// listen() starts accepting requests; the callback confirms the chosen address.
app.listen(port, () =>
  console.log(`Student Management API listening on http://localhost:${port}`),
);
