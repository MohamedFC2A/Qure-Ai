
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** QURE AI
- **Date:** 2026-01-20
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 User Registration with Valid Credentials
- **Test Code:** [TC001_User_Registration_with_Valid_Credentials.py](./TC001_User_Registration_with_Valid_Credentials.py)
- **Test Error:** User registration test failed due to invalid email validation error on the signup page. Valid emails are rejected, preventing successful registration. Issue reported for developer investigation.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/demo?_rsc=1r34m:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://qrqqyetewxiuogypogzo.supabase.co/auth/v1/signup?redirect_to=https%3A%2F%2Fqure-ai-nexus.vercel.app%2Fauth%2Fcallback:0:0)
[ERROR] Auth error: AuthApiError: Email address "newuser@example.com" is invalid
    at tM (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46241)
    at async tK (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:47185)
    at async tW (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46625)
    at async rm.signUp (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:71984)
    at async N (http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:40623)
    at async http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:32803 (at http://localhost:3000/_next/static/chunks/7951220b16116775.js:36:41059)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://qrqqyetewxiuogypogzo.supabase.co/auth/v1/signup?redirect_to=https%3A%2F%2Fqure-ai-nexus.vercel.app%2Fauth%2Fcallback:0:0)
[ERROR] Auth error: AuthApiError: Email address "doctor@medvision.ai" is invalid
    at tM (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46241)
    at async tK (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:47185)
    at async tW (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46625)
    at async rm.signUp (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:71984)
    at async N (http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:40623)
    at async http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:32803 (at http://localhost:3000/_next/static/chunks/7951220b16116775.js:36:41059)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/453cbab4-da9c-4fda-9169-1cc4269df601
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 User Registration with Invalid Email
- **Test Code:** [TC002_User_Registration_with_Invalid_Email.py](./TC002_User_Registration_with_Invalid_Email.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/6155321f-6b5f-4dc6-91b5-8ce0fd17e586
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 User Login with Valid Credentials
- **Test Code:** [TC003_User_Login_with_Valid_Credentials.py](./TC003_User_Login_with_Valid_Credentials.py)
- **Test Error:** Login attempt with the provided valid registered email and password failed due to 'Invalid login credentials' error. The user could not log in successfully. Task is stopped as login was not successful.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/demo?_rsc=1r34m:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://qrqqyetewxiuogypogzo.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Auth error: AuthApiError: Invalid login credentials
    at tM (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46241)
    at async tK (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:47185)
    at async tW (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46625)
    at async rm.signInWithPassword (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:73281)
    at async N (http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:40755)
    at async http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:32803 (at http://localhost:3000/_next/static/chunks/7951220b16116775.js:36:41059)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/bf0b4ed0-5b1b-45ba-a304-6e6d82b37187
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 User Login with Incorrect Password
- **Test Code:** [TC004_User_Login_with_Incorrect_Password.py](./TC004_User_Login_with_Incorrect_Password.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/8390874b-ac9d-4f81-8c36-7a92cbf4829c
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Dashboard Loads User-Specific Content
- **Test Code:** [TC005_Dashboard_Loads_User_Specific_Content.py](./TC005_Dashboard_Loads_User_Specific_Content.py)
- **Test Error:** All login attempts have failed: direct credentials were invalid, GitHub login is unsupported, and Google OAuth is blocked due to browser security restrictions. Without successful login, the dashboard cannot be accessed to verify personalized content. Please provide valid credentials or enable supported login methods to proceed with the test.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/demo?_rsc=1r34m:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://qrqqyetewxiuogypogzo.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Auth error: AuthApiError: Invalid login credentials
    at tM (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46241)
    at async tK (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:47185)
    at async tW (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46625)
    at async rm.signInWithPassword (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:73281)
    at async N (http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:40755)
    at async http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:32803 (at http://localhost:3000/_next/static/chunks/7951220b16116775.js:36:41059)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://qrqqyetewxiuogypogzo.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Auth error: AuthApiError: Invalid login credentials
    at tM (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46241)
    at async tK (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:47185)
    at async tW (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46625)
    at async rm.signInWithPassword (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:73281)
    at async N (http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:40755)
    at async http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:32803 (at http://localhost:3000/_next/static/chunks/7951220b16116775.js:36:41059)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://qrqqyetewxiuogypogzo.supabase.co/auth/v1/authorize?provider=github&redirect_to=https%3A%2F%2Fqure-ai-nexus.vercel.app%2Fauth%2Fcallback&code_challenge=eZMUeI_C0l3BYJb6PHxb4IM7J8Q7mDq5CvQEpJs7z2Y&code_challenge_method=s256:0:0)
[WARNING] An iframe which has both allow-scripts and allow-same-origin for its sandbox attribute can escape its sandboxing. (at https://accounts.youtube.com/accounts/CheckConnection?pmpo=https%3A%2F%2Faccounts.google.com&v=-1121429499&timestamp=1768866568787:0:0)
[WARNING] [GroupMarkerNotSet(crbug.com/242999)!:A00445003C340000]Automatic fallback to software WebGL has been deprecated. Please use the --enable-unsafe-swiftshader flag to opt in to lower security guarantees for trusted content. (at https://accounts.google.com/v3/signin/identifier?opparams=%253Fredirect_to%253Dhttps%25253A%25252F%25252Fqure-ai-nexus.vercel.app%25252Fauth%25252Fcallback&dsh=S1577985428%3A1768866561190340&client_id=451402074037-mnjk8tgn24544a1ean0lq6or986so1rs.apps.googleusercontent.com&o2v=2&redirect_uri=https%3A%2F%2Fqrqqyetewxiuogypogzo.supabase.co%2Fauth%2Fv1%2Fcallback&response_type=code&scope=email+profile&service=lso&state=eyJhbGciOiJFUzI1NiIsImtpZCI6IjQ4NmE1NTBmLWM4NzAtNGFjZi1iYTcwLTIxZjIxMWI2OWVhYSIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Njg4NjY4NTksInNpdGVfdXJsIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwIiwiaWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJmdW5jdGlvbl9ob29rcyI6bnVsbCwicHJvdmlkZXIiOiJnb29nbGUiLCJyZWZlcnJlciI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMC8iLCJmbG93X3N0YXRlX2lkIjoiN2E3MWM2NTMtYzkwZi00NjlhLTkwMDItMDYxYmViZWNmMTZiIn0.nAMxSlbXb8cn3TBjI3Hk3spZ918RIMmHC7B0iK6wtaoWgWrVaIjnPrYXInza7fR4UaA2De51-zMd3bC4_BcUwg&flowName=GeneralOAuthFlow&continue=https%3A%2F%2Faccounts.google.com%2Fsignin%2Foauth%2Fconsent%3Fauthuser%3Dunknown%26part%3DAJi8hAOlZos3bLdsturg0Qa5QBQncKK9IcdXjoPDtQ7RbUSyPYbGGKJKH7mv9K4a-2zCWuuq0IE0MzkFjJhwKRTijmUhWKWRoSXHerpvXG_Dqk33d0lMYvFP06vjsO8RKFP8dQkSGGF4c_7kG0a5cgHgIC-gWKpQN5Ft22z02nCE9ko_mczi1m6M82UF3tqkOm8Et9bD_yKVNk99CZ8XqjNqhZItg25LtxUFMO9OSUzv7BWWdRxtqfnNDORwtGK-jRirldbk4EFccp3gK16c2xvPhW9jq_l2Q-M1qa8J_nWhL7m1gV9IzSTOHQMioYDmbGevEe_xfa0RQafYLZXvT9P33HKWH7OWM7iqMAfr46RN1HB7zN0n53RYc3v_FmZEvLCRDuyFy9GxaG7ngsBlGbPVNAKxTriSybMWN1EGBzxnpHBgC2fcOVOR6u41SAWwjChhvsmj8gxrY0UIocSWcyMs5Xo0kVAe3GUSauPO2hbKWnEXlVruVdY%26flowName%3DGeneralOAuthFlow%26as%3DS1577985428%253A1768866561190340%26client_id%3D451402074037-mnjk8tgn24544a1ean0lq6or986so1rs.apps.googleusercontent.com%26requestPath%3D%252Fsignin%252Foauth%252Fconsent%23&app_domain=https%3A%2F%2Fqrqqyetewxiuogypogzo.supabase.co&rart=ANgoxcfFrq9w8OVurycI1YjuC95Uaza_wSGJ5KnJ55Hke8R5FXyr56kwAdZNUCyRnLSVU2t5WwaHLC8qSStYI9f-JLBL1E6vL0KusjNoAKpwLaJo56w01Zw:0:0)
[WARNING] An iframe which has both allow-scripts and allow-same-origin for its sandbox attribute can escape its sandboxing. (at https://accounts.youtube.com/accounts/CheckConnection?pmpo=https%3A%2F%2Faccounts.google.com&v=-1121429499&timestamp=1768866618518:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/4824ac0a-1be7-4ba1-8309-a0d2d252742b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Dashboard User Actions Execution
- **Test Code:** [TC006_Dashboard_User_Actions_Execution.py](./TC006_Dashboard_User_Actions_Execution.py)
- **Test Error:** Testing stopped due to failure in adding a new content item on the dashboard. The 'Create' button does not function as expected, preventing further tests on editing and deleting items. Issue reported for developer investigation.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/_next/static/chunks/82abf2d65f5428ae.js:0:0)
[WARNING] The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width. (at http://localhost:3000/_next/static/chunks/4dd6ebec0e7181d8.js:0:87877)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/keys:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/keys:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/f325a194-780a-41d5-8952-84113e8bbc92
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 OCR Text Extraction from Clear Image
- **Test Code:** [TC007_OCR_Text_Extraction_from_Clear_Image.py](./TC007_OCR_Text_Extraction_from_Clear_Image.py)
- **Test Error:** The OCR Scanner feature page was successfully accessed and is ready for image upload. However, the image upload and OCR scan steps were not performed, so the accuracy of the OCR text extraction could not be verified. The task is not fully complete as the critical step of uploading a clear, high-resolution image and verifying the extracted text remains to be done.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/demo?_rsc=1r34m:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/597c8ee5-7129-484c-9c68-f504fd4129d4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 OCR Text Extraction from Low-Quality Image
- **Test Code:** [TC008_OCR_Text_Extraction_from_Low_Quality_Image.py](./TC008_OCR_Text_Extraction_from_Low_Quality_Image.py)
- **Test Error:** The OCR Scanner feature page was successfully reached and prepared for testing. However, the critical step of uploading a low-quality or blurred image and starting the OCR scan was not performed. Therefore, the OCR extraction accuracy on low-quality or blurred images could not be verified. The task is incomplete as the main verification step was not executed.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/_next/static/chunks/d8c63eb86ccbbc66.js:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/7982ea46-cfb5-4ec6-aa77-e0b843bdbf75
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 OCR Scanner with Image Having No Text
- **Test Code:** [TC009_OCR_Scanner_with_Image_Having_No_Text.py](./TC009_OCR_Scanner_with_Image_Having_No_Text.py)
- **Test Error:** The OCR Scanner feature page was successfully reached and the upload area was identified. However, due to limitations in file upload automation, the test image containing no text or purely graphical content could not be uploaded. Consequently, the OCR scan was not started, and the output verification for handling images with no text could not be performed. The task is incomplete as the critical step of uploading the image and verifying the OCR output was not achieved.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/demo?_rsc=1r34m:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/a6d76a1f-da80-4a1d-ac9d-a7801d85f530
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 API Endpoint Response for AI Services Success
- **Test Code:** [TC010_API_Endpoint_Response_for_AI_Services_Success.py](./TC010_API_Endpoint_Response_for_AI_Services_Success.py)
- **Test Error:** API key generation is not functioning, blocking further API endpoint testing. Issue reported. Stopping the task.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/_next/static/chunks/df00ddc89701ba55.css:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/demo?_rsc=1r34m:0:0)
[WARNING] The resource http://localhost:3000/_next/static/media/83afe278b6a6bb3c-s.p.3a6ba036.woff2 was preloaded using link preload but not used within a few seconds from the window's load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally. (at http://localhost:3000/:0:0)
[WARNING] The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width. (at http://localhost:3000/_next/static/chunks/4dd6ebec0e7181d8.js:0:87877)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/keys:0:0)
[WARNING] The resource http://localhost:3000/_next/static/media/83afe278b6a6bb3c-s.p.3a6ba036.woff2 was preloaded using link preload but not used within a few seconds from the window's load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally. (at http://localhost:3000/dashboard:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/keys:0:0)
[WARNING] The resource http://localhost:3000/_next/static/media/83afe278b6a6bb3c-s.p.3a6ba036.woff2 was preloaded using link preload but not used within a few seconds from the window's load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally. (at http://localhost:3000/dashboard:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/43119cb8-8c5b-48ca-8b11-092bfb311f1b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 API Endpoint Handling of Invalid Requests
- **Test Code:** [TC011_API_Endpoint_Handling_of_Invalid_Requests.py](./TC011_API_Endpoint_Handling_of_Invalid_Requests.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/c71ef162-185f-43b5-b521-eec67a830fdf
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 API Endpoint Unauthorized Access Prevention
- **Test Code:** [TC012_API_Endpoint_Unauthorized_Access_Prevention.py](./TC012_API_Endpoint_Unauthorized_Access_Prevention.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/90c72b98-914e-48bb-8032-61fca8c0b0d7
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Documentation Accessibility Check
- **Test Code:** [TC013_Documentation_Accessibility_Check.py](./TC013_Documentation_Accessibility_Check.py)
- **Test Error:** Developer documentation is not accessible from the application main page or navigation menu. No link or button found to access developer documentation. Testing stopped as documentation cannot be verified.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/_next/static/chunks/85a319c156f67bb8.js:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/demo?_rsc=1r34m:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/b7330a21-3f2d-4778-9589-4a1c1b27a49d
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Developer Documentation Content Verification
- **Test Code:** [TC014_Developer_Documentation_Content_Verification.py](./TC014_Developer_Documentation_Content_Verification.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/9282ce7a-f4e5-4bf6-a116-6f31ada3c19a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Session Management Post Login
- **Test Code:** [TC015_Session_Management_Post_Login.py](./TC015_Session_Management_Post_Login.py)
- **Test Error:** Login attempts failed due to invalid credentials and disabled OAuth providers. Unable to verify session maintenance across dashboard and API calls. Recommend enabling valid login methods for testing. Stopping further actions.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/_next/static/chunks/df00ddc89701ba55.css:0:0)
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/_next/static/chunks/d8c63eb86ccbbc66.js:0:0)
[WARNING] The resource http://localhost:3000/_next/static/media/83afe278b6a6bb3c-s.p.3a6ba036.woff2 was preloaded using link preload but not used within a few seconds from the window's load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally. (at http://localhost:3000/:0:0)
[WARNING] The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width. (at http://localhost:3000/_next/static/chunks/4dd6ebec0e7181d8.js:0:87877)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/keys:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://qrqqyetewxiuogypogzo.supabase.co/auth/v1/token?grant_type=password:0:0)
[ERROR] Auth error: AuthApiError: Invalid login credentials
    at tM (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46241)
    at async tK (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:47185)
    at async tW (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46625)
    at async rm.signInWithPassword (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:73281)
    at async N (http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:40755)
    at async http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:32803 (at http://localhost:3000/_next/static/chunks/7951220b16116775.js:36:41059)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://qrqqyetewxiuogypogzo.supabase.co/auth/v1/authorize?provider=github&redirect_to=https%3A%2F%2Fqure-ai-nexus.vercel.app%2Fauth%2Fcallback&code_challenge=4za1FdYHRy5KFIGXZ1xUy-Ld4ylW5C3z6usmPIow8lY&code_challenge_method=s256:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/2ba05207-1c90-4169-bba7-7a20a326a7a8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Password Security Policy Enforcement
- **Test Code:** [TC016_Password_Security_Policy_Enforcement.py](./TC016_Password_Security_Policy_Enforcement.py)
- **Test Error:** The registration form enforces minimum password length correctly by blocking too short passwords and showing a descriptive error message. However, the email validation is overly restrictive and rejects valid email addresses, preventing further testing of other password complexity rules. The password change form could not be accessed for testing. The email validation issue should be addressed to enable full password complexity verification. Task stopped due to this blocker.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at http://localhost:3000/_next/static/chunks/85a319c156f67bb8.js:0:0)
[WARNING] The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width. (at http://localhost:3000/_next/static/chunks/4dd6ebec0e7181d8.js:0:87877)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/keys:0:0)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://qrqqyetewxiuogypogzo.supabase.co/auth/v1/signup?redirect_to=https%3A%2F%2Fqure-ai-nexus.vercel.app%2Fauth%2Fcallback:0:0)
[ERROR] Auth error: AuthApiError: Email address "testuser@example.com" is invalid
    at tM (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46241)
    at async tK (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:47185)
    at async tW (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46625)
    at async rm.signUp (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:71984)
    at async N (http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:40623)
    at async http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:32803 (at http://localhost:3000/_next/static/chunks/7951220b16116775.js:36:41059)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://qrqqyetewxiuogypogzo.supabase.co/auth/v1/signup?redirect_to=https%3A%2F%2Fqure-ai-nexus.vercel.app%2Fauth%2Fcallback:0:0)
[ERROR] Auth error: AuthApiError: Email address "doctor@medvision.ai" is invalid
    at tM (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46241)
    at async tK (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:47185)
    at async tW (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46625)
    at async rm.signUp (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:71984)
    at async N (http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:40623)
    at async http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:32803 (at http://localhost:3000/_next/static/chunks/7951220b16116775.js:36:41059)
[ERROR] Failed to load resource: the server responded with a status of 400 () (at https://qrqqyetewxiuogypogzo.supabase.co/auth/v1/signup?redirect_to=https%3A%2F%2Fqure-ai-nexus.vercel.app%2Fauth%2Fcallback:0:0)
[ERROR] Auth error: AuthApiError: Email address "doctor.medvision@example.com" is invalid
    at tM (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46241)
    at async tK (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:47185)
    at async tW (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:46625)
    at async rm.signUp (http://localhost:3000/_next/static/chunks/8046172804c0c690.js:24:71984)
    at async N (http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:40623)
    at async http://localhost:3000/_next/static/chunks/7951220b16116775.js:37:32803 (at http://localhost:3000/_next/static/chunks/7951220b16116775.js:36:41059)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/81971c61-c84a-41c4-b932-23dfee5e7722/3f685776-e3fa-49fd-aa12-e6e920043414
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **31.25** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---