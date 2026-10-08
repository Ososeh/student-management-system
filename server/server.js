// Start the HTTP listener. app.js defines middleware/routes; this file only
// chooses a port and makes that configured application accept connections.
import app from'./app.js';const port=Number(process.env.PORT||5000);app.listen(port,()=>console.log(`Student Management API listening on http://localhost:${port}`));
