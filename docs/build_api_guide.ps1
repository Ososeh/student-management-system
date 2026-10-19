$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$target = Join-Path $PSScriptRoot 'Student_Management_System_API_Guide.docx'
if (Test-Path $target) { Remove-Item $target -Force }

$body = [System.Collections.Generic.List[string]]::new()
function Escape-Xml([string]$value) {
  return [System.Security.SecurityElement]::Escape($value)
}
function Add-Paragraph([string]$text, [string]$style = 'Normal') {
  $safe = Escape-Xml $text
  $body.Add("<w:p><w:pPr><w:pStyle w:val='$style'/></w:pPr><w:r><w:t xml:space='preserve'>$safe</w:t></w:r></w:p>")
}
function Add-Table([string[]]$headers, [object[]]$rows, [int[]]$widths) {
  $border = "<w:tblBorders><w:top w:val='single' w:sz='4' w:color='CBD5E1'/><w:left w:val='single' w:sz='4' w:color='CBD5E1'/><w:bottom w:val='single' w:sz='4' w:color='CBD5E1'/><w:right w:val='single' w:sz='4' w:color='CBD5E1'/><w:insideH w:val='single' w:sz='4' w:color='CBD5E1'/><w:insideV w:val='single' w:sz='4' w:color='CBD5E1'/></w:tblBorders>"
  $grid = '<w:tblGrid>' + (($widths | ForEach-Object { "<w:gridCol w:w='$_'/>" }) -join '') + '</w:tblGrid>'
  $xml = "<w:tbl><w:tblPr><w:tblW w:w='0' w:type='auto'/>$border</w:tblPr>$grid"
  $allRows = [System.Collections.Generic.List[object]]::new()
  $allRows.Add($headers)
  foreach ($row in $rows) { $allRows.Add($row) }
  for ($r = 0; $r -lt $allRows.Count; $r++) {
    $cells = ''
    for ($c = 0; $c -lt $headers.Count; $c++) {
      $text = Escape-Xml ([string]$allRows[$r][$c])
      $shade = if ($r -eq 0) { "<w:shd w:fill='123B4A'/>" } elseif ($r % 2 -eq 0) { "<w:shd w:fill='F1F5F7'/>" } else { '' }
      $color = if ($r -eq 0) { "<w:color w:val='FFFFFF'/>" } else { '' }
      $bold = if ($r -eq 0) { '<w:b/>' } else { '' }
      $width = $widths[$c]
      $cells += "<w:tc><w:tcPr><w:tcW w:w='$width' w:type='dxa'/>$shade</w:tcPr><w:p><w:pPr><w:spacing w:after='40'/></w:pPr><w:r><w:rPr>$bold$color<w:sz w:val='18'/></w:rPr><w:t xml:space='preserve'>$text</w:t></w:r></w:p></w:tc>"
    }
    $xml += "<w:tr>$cells</w:tr>"
  }
  $body.Add($xml + '</w:tbl>')
  Add-Paragraph ''
}

Add-Paragraph 'STUDENT MANAGEMENT SYSTEM' 'Title'
Add-Paragraph 'API guide for beginners' 'Subtitle'
Add-Paragraph 'Source-based guide | Reviewed 19 October 2026' 'Small'
Add-Paragraph 'This guide describes the code in this project, not an assumed cloud architecture. The React/Vite client is deployed on Vercel. The Express API is a separate Node.js service. The repository does not identify a production API host, and the deployed site currently has no working production API URL configured.' 'Callout'
Add-Paragraph 'A. Introduction to APIs' 'Heading1'
Add-Paragraph 'An API is a set of agreed ways for one program to ask another program to do something. Think of a restaurant: you tell a waiter what you want, the waiter carries the request to the kitchen, and brings the result back. The waiter is like the API boundary; the kitchen is like the backend.'
Add-Paragraph 'In this project, the frontend is the website shown in the browser (React). The backend is the Express server that checks requests and applies rules. The JSON file at server/data/db.json is the current storage layer: it keeps accounts, courses, students, and saved progress. The API is the HTTP interface between the frontend and backend.'
Add-Paragraph 'For example, when a user saves a student, the React form sends JSON to POST /api/students. Express checks the bearer token, validates the fields and course ownership, writes the record to the JSON file, and returns the saved student as JSON. The React page then updates or navigates based on that response.'
Add-Paragraph 'B. How this project API works' 'Heading1'
Add-Paragraph 'The backend uses Node.js and Express. server/server.js listens on PORT (5000 by default). server/app.js installs JSON request parsing, CORS, a health check, routes, and final 404/error handling. The frontend uses Axios; client/src/services/api.js selects VITE_API_URL or falls back to http://localhost:5000/api.'
Add-Paragraph 'Send JSON requests with Content-Type: application/json. Protected routes also need Authorization: Bearer <token>. The browser client adds this header from localStorage automatically. Do not paste a real token into screenshots or share it.'
Add-Paragraph 'Endpoint reference' 'Heading2'
Add-Table @('Method and path (under /api)', 'Access', 'Purpose and response') @(
  ,@('GET /health', 'Public', 'Health check: { status: "ok", service: "student-management-api" }.')
  ,@('POST /auth/register', 'Public', 'Creates account; returns { user, token }; HTTP 201.')
  ,@('POST /auth/login', 'Public', 'Checks credentials; returns { user, token }; HTTP 200.')
  ,@('GET /auth/me', 'Bearer token', 'Returns the verified safe profile as { user }.')
  ,@('GET /students?search=term', 'Bearer token', 'Returns { students: [...] }; search is optional and matches name, email, or course name.')
  ,@('GET /students/:id', 'Bearer token', 'Returns { student }; includes related course or null. Other owners receive 404.')
  ,@('POST /students', 'Bearer token', 'Creates a student; returns { student }; HTTP 201.')
  ,@('PUT /students/:id', 'Bearer token', 'Replaces editable student fields; returns { student }; HTTP 200.')
  ,@('DELETE /students/:id', 'Bearer token', 'Deletes an owned student; HTTP 204 with no body.')
  ,@('GET /courses', 'Bearer token', 'Returns { courses: [...] }; each course includes calculated studentCount.')
  ,@('GET /courses/:id', 'Bearer token', 'Returns { course } with calculated studentCount.')
  ,@('POST /courses', 'Bearer token', 'Creates a course; returns { course }; HTTP 201.')
  ,@('PUT /courses/:id', 'Bearer token', 'Updates course fields; returns { course }; HTTP 200.')
  ,@('DELETE /courses/:id', 'Bearer token', 'Deletes course; HTTP 204, or 409 while students are assigned.')
  ,@('GET /progress', 'Bearer token', 'Returns { progress } for the signed-in account.')
  ,@('PUT /progress', 'Bearer token', 'Merges allowed progress fields; returns { progress }.')
) @(2600, 6760)
Add-Paragraph 'Request bodies and validation' 'Heading2'
Add-Paragraph 'Registration body: { "name": "Amina Example", "email": "amina@example.test", "password": "<your disposable test password>" }. Replace the placeholder with a test-only password of at least eight characters containing an uppercase letter, a number, and a special character. An existing email returns 409. Passwords are stored as bcrypt hashes, not plain text.'
Add-Paragraph 'Student create and update body: { "name": "Jordan Example", "email": "jordan@example.test", "courseId": "<id returned by POST /api/courses>", "status": "Active", "score": 80 }. Name must not be blank; email must match a basic email pattern; courseId must refer to a course owned by this account; status must be exactly Active or Inactive; score must be a number from 0 through 100. PUT sends all these editable fields.'
Add-Paragraph 'Course create and update body: { "name": "Biology", "code": "BIO101", "description": "Foundations of biology" }. All fields are required; code is stored uppercase and must be unique for the account. A course with students cannot be deleted (409).'
Add-Paragraph 'Progress accepts only recognized fields: lastPath, studentSearch (up to 200 characters), studentFormDraft, and courseFormDraft. Form drafts accept only the corresponding form fields. Sending a draft as null clears it. PUT merges supplied fields instead of replacing the whole progress object.'
Add-Paragraph 'Authentication and ownership' 'Heading2'
Add-Paragraph 'Registration/login returns a JWT (a signed session token) and a safe user profile. The token is signed with server-only JWT_SECRET and expires after two hours. Protected endpoints use middleware to verify the signature, expiry, and that the account still exists. The authenticated user id, never an id from the request body, controls which records can be read or changed. Missing, invalid, or expired tokens return HTTP 401. Password hashes and JWT_SECRET are not returned to the browser.'
Add-Paragraph 'The current data store is a JSON file, not PostgreSQL or another database server. Writes are serialized and the file is replaced atomically. This is suitable for a small local demo, but a filesystem may not persist or be shared across instances on serverless hosting. The source includes SMS_DB_PATH to point to a different local file; no cloud database adapter is implemented.'
Add-Paragraph 'Error responses' 'Heading2'
Add-Table @('HTTP status', 'Meaning in this project', 'Example') @(
  ,@('200', 'Request succeeded.', 'List or update response.')
  ,@('201', 'Record/account created.', 'POST registration/student/course.')
  ,@('204', 'Deleted successfully; response has no body.', 'DELETE student/course.')
  ,@('400', 'Missing or invalid request data.', 'Invalid student status or course fields.')
  ,@('401', 'Authentication is missing or rejected; login credentials may also be wrong.', 'Missing bearer token or expired session.')
  ,@('404', 'Record or API route was not found.', 'Unknown student id or Vercel /api/health route.')
  ,@('409', 'Request conflicts with existing data.', 'Duplicate course code or deleting a course with students.')
  ,@('500', 'Unexpected backend failure.', 'Server returns a generic message; operator logs contain details.')
) @(1500, 5200, 2660)
Add-Paragraph 'The client shows loading, empty, and error states around requests. Axios logs a generic failure and clears local session storage on HTTP 401. Form validation runs in the browser for quick feedback, and the server repeats validation because browser checks can be bypassed.'
Add-Paragraph 'C. Test the API locally on Windows' 'Heading1'
Add-Paragraph '1. Open the project folder in Visual Studio Code. Open Terminal > New Terminal and make sure the prompt is at the project root (the folder containing the root package.json). Install dependencies once with npm install.'
Add-Paragraph '2. Start both services from the project root:' 'Heading2'
Add-Paragraph 'npm run dev' 'Code'
Add-Paragraph 'This starts Vite (normally http://localhost:5173) and Express (normally http://localhost:5000) in parallel. Vite serves the interface; Express serves /api routes. In a second terminal, check the API:'
Add-Paragraph 'Invoke-RestMethod http://localhost:5000/api/health' 'Code'
Add-Paragraph 'Expected: an object with status=ok and service=student-management-api. Open http://localhost:5173 in a browser for the site. The local API base is http://localhost:5000/api, unless client/.env sets VITE_API_URL to another value.'
Add-Paragraph '3. Safe API exercise with PowerShell or Postman' 'Heading2'
Add-Paragraph 'Use a disposable local test account. Registration creates a persistent account and this project has no account-delete endpoint. Student/course rows can be deleted, but use only data you are comfortable retaining. Do not use a real password in a shared screen recording.' 'Callout'
Add-Paragraph 'In PowerShell, set the base URL and register an account. Replace the sample email with a new address you control for testing:'
$registerCommands = @'
$base = 'http://localhost:5000/api'
$password = Read-Host 'Enter a disposable test password'
$payload = @{ name = 'API Demo'; email = 'api-demo@example.test'; password = $password } | ConvertTo-Json
$session = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body $payload
$token = $session.token
'@
Add-Paragraph $registerCommands 'Code'
Add-Paragraph 'Create a course first because a student must reference a course owned by the same account:'
$courseCommands = @'
$courseBody = @{ name = 'Biology'; code = 'BIO101'; description = 'Foundations of biology' } | ConvertTo-Json
$course = Invoke-RestMethod -Method Post -Uri "$base/courses" -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $courseBody
$courseId = $course.course.id
'@
Add-Paragraph $courseCommands 'Code'
Add-Paragraph 'Create, list, and change student status. The API uses PUT for the full editable student record; changing only the status still requires sending the other required fields.'
$studentCommands = @'
$studentBody = @{ name = 'Jordan Example'; email = 'jordan@example.test'; courseId = $courseId; status = 'Active'; score = 80 } | ConvertTo-Json
$student = Invoke-RestMethod -Method Post -Uri "$base/students" -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $studentBody
Invoke-RestMethod -Uri "$base/students" -Headers @{ Authorization = "Bearer $token" }
$studentId = $student.student.id
$studentBody = @{ name = 'Jordan Example'; email = 'jordan@example.test'; courseId = $courseId; status = 'Inactive'; score = 80 } | ConvertTo-Json
Invoke-RestMethod -Method Put -Uri "$base/students/$studentId" -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $studentBody
'@
Add-Paragraph $studentCommands 'Code'
Add-Paragraph 'The returned student.status should be Inactive. Refresh the Students page or GET /students to confirm it is still Inactive. Change status back to Active using the same PUT body with status = Active to confirm the transition works in both directions. In the interface, the badge class is selected from the actual status value.'
Add-Paragraph 'To remove the demonstration records after the test, delete the student first, then the course:'
$deleteCommands = @'
Invoke-RestMethod -Method Delete -Uri "$base/students/$studentId" -Headers @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Method Delete -Uri "$base/courses/$courseId" -Headers @{ Authorization = "Bearer $token" }
'@
Add-Paragraph $deleteCommands 'Code'
Add-Paragraph 'In Postman, create requests with the same method and URL. For JSON bodies choose Body > raw > JSON. For protected calls add Authorization > Bearer Token and paste the token only into your local Postman session. A successful DELETE returns 204, so an empty response body is expected.'
Add-Paragraph '4. Inspect browser requests' 'Heading2'
Add-Paragraph 'In Chrome or Edge press F12, select Network, enable Preserve log, and filter Fetch/XHR. Sign in, open Students, and click a student action. Select a request to inspect Request URL, Method, Status, Headers, Payload, and Response. Do not share screenshots containing Authorization tokens, passwords, or personal student data. Console errors can help, but the Network panel is the best way to tell whether the browser reached the intended API.'
Add-Paragraph '5. Interpret results and verify storage' 'Heading2'
Add-Paragraph 'A successful list returns HTTP 200 and { students: [...] }. Create returns 201 and { student: ... }. Invalid fields return 400 with message and, for student/course validation, an errors array. Missing authentication returns 401. A record missing or owned by another account returns 404. The server writes local records to server/data/db.json by default. Only inspect your own test record; never upload this file because it contains password hashes and private data. API integration tests use a temporary SMS_DB_PATH so they do not modify this file.'
Add-Paragraph 'To test a network/server failure safely, stop the local API and load the Students page. The page should show an error state with a retry action. Restart the API and retry. A browser message such as ERR_CONNECTION_REFUSED means no server answered at that host/port; it is different from an HTTP 400/500 response.'
Add-Paragraph 'D. Test the deployed environment' 'Heading1'
Add-Paragraph 'Verified architecture: client/vercel.json rewrites requests to index.html for the React single-page application. It does not define an Express serverless function or deploy the server folder. The deployed Vercel site returns a Vercel 404 for /api/health. The deployed JavaScript was observed using http://localhost:5000/api as its API base. Therefore no working production API base URL can be verified from this project, and authenticated production workflows are not currently connected to a hosted backend.' 'Callout'
Add-Paragraph 'A browser on a mentor or user computer interprets localhost as that same computer, not your computer and not Vercel. So the deployed site cannot reach your development API by using localhost. Do not guess a production URL. First deploy the Express API to a separate Node-capable host and configure its persistent storage, then use the host-provided HTTPS URL.'
Add-Paragraph 'After the API host is confirmed, set the Vercel project environment variable VITE_API_URL to the host API root, for example https://your-api-host.example/api (placeholder only, not a verified project URL). Keep JWT_SECRET server-side only. The current server calls cors() with its defaults, which allows requests from any origin; for production, replace that permissive default with an allowlist containing the actual Vercel origin. Redeploy the frontend after changing a Vite environment variable because Vite embeds it at build time.'
Add-Paragraph 'To test production safely, first visit the real API host health URL (API_BASE/health), then use Postman with a disposable account and test data. Compare the same request, response status, and JSON fields locally and in production. In DevTools Network, confirm the deployed Request URL uses the API host, never localhost. In Vercel project settings, check that VITE_API_URL exists for the Production environment without copying its value into screenshots; check API-host logs and environment variable names there as well. Never expose JWT_SECRET or bearer tokens.'
Add-Paragraph 'A separately hosted API must also have storage that survives restarts and is shared by all instances. The current JSON-file implementation does not include a managed database adapter. A serverless or ephemeral filesystem can lose data, and multiple instances can diverge. Confirm the hosting platform supports this storage model or adapt the backend to a persistent database before using it for real production records.'
Add-Paragraph 'E. Practical examples and troubleshooting' 'Heading1'
Add-Paragraph 'Retrieve students: GET /api/students with Authorization: Bearer <token>. Optional search: GET /api/students?search=Jordan. Success is 200 with { students: [...] }; an empty account returns an empty array.'
Add-Paragraph 'Register a student: POST /api/students with name, valid email, courseId, status, and score. The course must exist in the same user workspace. Success is 201 with { student: ... }. Use GET /api/courses first to obtain a valid course id.'
Add-Paragraph 'Update student details or status: PUT /api/students/{id} with all required student fields. Success is 200 with the saved student. Use status exactly Active or Inactive. The source uses the same update operation for any status transition.'
Add-Paragraph 'Delete a student: DELETE /api/students/{id}. Success is 204 and has no JSON body. A later GET should no longer include that record.'
Add-Table @('Symptom', 'Possible cause', 'Safe diagnostic action') @(
  ,@('ERR_CONNECTION_REFUSED / network error', 'API is stopped, wrong hostname/port, or unreachable.', 'Check the server terminal and GET /api/health; verify the full request URL.')
  ,@('HTTP 401', 'Missing/expired token, invalid credentials, or wrong API host.', 'Sign in again; inspect Authorization header privately; check host clock and server logs.')
  ,@('HTTP 400', 'Required fields or values fail validation.', 'Read response message/errors; check exact status spelling, courseId, email, score.')
  ,@('HTTP 404 on /api/health at Vercel', 'Vercel deployment contains the frontend rewrite but no API handler.', 'Test the separately hosted backend health path; do not route API requests to SPA index.html.')
  ,@('Browser CORS error', 'A deployed API may have an origin policy that rejects the website.', 'Inspect the browser console and API CORS settings. This source currently uses permissive cors() defaults; restrict it to the production origin when deploying.')
  ,@('Vercel request goes to localhost', 'VITE_API_URL was absent or wrong at frontend build time.', 'Inspect deployed request URL; set VITE_API_URL in Vercel Production settings and redeploy.')
  ,@('HTTP 409', 'Duplicate course code or deleting a course still in use.', 'Read response message; use a unique code or reassign/delete its students first.')
  ,@('HTTP 500 or data missing after restart', 'Backend exception or file-based storage is ephemeral/unshared.', 'Check API-host logs and persistence configuration; never paste secrets or database files into a report.')
) @(2400, 3900, 3060)
Add-Paragraph 'F. Questions a mentor may ask' 'Heading1'
Add-Paragraph 'What is an API? It is a defined way for software to exchange requests and responses. Here, the browser sends HTTP requests to Express and receives JSON.' 'Question'
Add-Paragraph 'How does the frontend talk to the backend? Axios calls the base URL from VITE_API_URL (or the local fallback), sends JSON, and attaches a bearer token for protected endpoints.' 'Question'
Add-Paragraph 'How does a request reach the stored data? Express routes validate and authorize the request, then call the JSON storage helper to read or update server/data/db.json. The backend returns a JSON result to the frontend.' 'Question'
Add-Paragraph 'How is student data protected? JWT middleware identifies the account; each route filters records by that account id. Passwords are bcrypt-hashed. This is application-level account separation, not a substitute for a production database/security review.' 'Question'
Add-Paragraph 'How does the API handle errors? Routes return specific HTTP statuses and JSON messages for expected problems. A final Express handler returns a generic 500 message. The client shows an error state and clears stored session data on 401.' 'Question'
Add-Paragraph 'How can a student become inactive? Send PUT /api/students/{id} with all required editable fields and status set to Inactive. The response/list carries that exact status; dashboard/list components choose the inactive CSS class from the status value.' 'Question'
Add-Paragraph 'What is different about local and production testing? Locally Vite and Express run separately on ports 5173 and 5000. Vercel currently serves only the frontend; an independently hosted API and production VITE_API_URL are required. Production data/storage may also differ.' 'Question'
Add-Paragraph 'Does this project use a relational database? No. The implemented storage is a JSON file. A database server or cloud persistence adapter is not present in the source.' 'Question'
Add-Paragraph 'G. Quick reference' 'Heading1'
Add-Table @('Item', 'Verified value') @(
  ,@('Local frontend', 'http://localhost:5173')
  ,@('Local API base', 'http://localhost:5000/api (default; client/.env can override)')
  ,@('Health check', 'GET http://localhost:5000/api/health')
  ,@('Production frontend', 'https://student-management-system-wheat-zeta.vercel.app/')
  ,@('Production API base', 'Not verified; no API host is defined in repository. Vercel /api/health returned 404.')
  ,@('Start all local services', 'From project root: npm run dev')
  ,@('Run tests', 'From project root: npm test')
  ,@('Build frontend', 'From project root: npm run build')
  ,@('Test tools', 'PowerShell Invoke-RestMethod, Postman, browser DevTools Network/Console')
  ,@('Production configuration', 'Host Express separately; configure VITE_API_URL and server-only JWT_SECRET; use persistent storage and suitable CORS.')
) @(3000, 6360)
Add-Paragraph 'Commands are run in a PowerShell terminal opened at the project root. The production API hostname, production database, and physical-device behavior could not be verified from source or the available deployment.' 'Small'
Add-Paragraph 'Evidence and current test scope' 'Heading1'
Add-Paragraph 'Source checks confirm .status-badge.inactive has an orange background (#fff0eb) and orange-brown text (#c2410c); active styling remains green. Dashboard, student list, and student detail render status-dependent badge classes. The deployed CSS asset inspected during this review contained a gray inactive rule, which is consistent with a stale deployed frontend bundle. The current source build contains the orange rule. Redeploy the current client build to publish it; no conditional rendering workaround is needed.'
Add-Paragraph 'The source integration test creates a student, updates Inactive then Active, and verifies the API response and list result. Project verification: 6 client tests and 5 server tests passed; production client build passed. Browser viewport simulation checked only the unauthenticated login page at widths 360, 768, 1024, and 1440 CSS pixels; neither local nor deployed login had horizontal overflow. Authenticated CRUD, production API calls, and physical devices were not tested because a test account and production API host were not available.'
Add-Paragraph 'To complete verification after deployment: redeploy the client, confirm the new CSS asset and orange badge using an authorized test student, host/configure the API, then repeat create/view/edit/status/delete and error-state tests locally and in production. Physical devices should be checked by opening the site on actual iOS and Android phones/tablets over a reachable HTTPS deployment.'

$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>$($body -join '')<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="900" w:right="900" w:bottom="900" w:left="900"/></w:sectPr></w:body></w:document>
"@
$stylesXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="21"/><w:color w:val="20313B"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="280" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="34"/><w:color w:val="123B4A"/></w:rPr><w:pPr><w:spacing w:before="220" w:after="80"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="25"/><w:color w:val="386779"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="123B4A"/></w:rPr><w:pPr><w:spacing w:before="320" w:after="120"/><w:keepNext/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="23"/><w:color w:val="167A70"/></w:rPr><w:pPr><w:spacing w:before="220" w:after="80"/><w:keepNext/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="17"/><w:color w:val="123B4A"/></w:rPr><w:pPr><w:shd w:fill="F1F5F7"/><w:ind w:left="180" w:right="180"/><w:spacing w:before="50" w:after="80"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Callout"><w:name w:val="Callout"/><w:basedOn w:val="Normal"/><w:rPr><w:color w:val="8A4B08"/></w:rPr><w:pPr><w:shd w:fill="FFF4DF"/><w:ind w:left="180" w:right="180"/><w:spacing w:before="100" w:after="180"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Question"><w:name w:val="Question"/><w:basedOn w:val="Normal"/><w:rPr><w:color w:val="20313B"/></w:rPr><w:pPr><w:ind w:left="180"/><w:spacing w:after="180"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Small"><w:name w:val="Small"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="18"/><w:color w:val="52636D"/></w:rPr></w:style>
</w:styles>
'@
$relsXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>
'@
$docRelsXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>
'@
$contentTypesXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>
'@

$archive = [System.IO.Compression.ZipFile]::Open($target, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $parts = @{
    '[Content_Types].xml' = $contentTypesXml
    '_rels/.rels' = $relsXml
    'word/document.xml' = $documentXml
    'word/styles.xml' = $stylesXml
    'word/_rels/document.xml.rels' = $docRelsXml
  }
  foreach ($part in $parts.GetEnumerator()) {
    $entry = $archive.CreateEntry($part.Key)
    $stream = $entry.Open()
    $writer = [System.IO.StreamWriter]::new($stream, [System.Text.UTF8Encoding]::new($false))
    try { $writer.Write($part.Value) } finally { $writer.Dispose() }
  }
} finally { $archive.Dispose() }
Write-Output "Created $target"
