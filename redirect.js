// Ensure DOM elements exist before using them
const messageContainer = document.getElementById('messageContainer');
const messageText = document.getElementById('messageText');

if (!messageContainer || !messageText) {
    console.error("Message container or text element is missing in the HTML.");
}

// Function to parse query parameters from URL
function getQueryParams(url) {
    const queryString = url.split('?')[1];
    const params = new URLSearchParams(queryString);
    return {
        cli: params.get('cli')?.replace(/^"|"$/g, ''),
        sid: params.get('sid'),
    };
}

// Function to decode Base64-encoded CLI
function decodeBase64(encodedString) {
    try {
        return atob(encodedString);
    } catch (error) {
        console.error("Error decoding Base64:", error);
        redirectToErrorPage("Invalid CLI format.");
        return null;
    }
}

// Function to redirect to the error page with a message
function redirectToErrorPage(message) {
    const errorPageUrl = `error.html?error=${encodeURIComponent(message)}`;
    window.location.href = errorPageUrl;
}

// Function to handle user access
async function handleUserAccess() {
    const { cli, sid } = getQueryParams(window.location.href);

    if (!cli || !sid) {
        return redirectToErrorPage("Missing CLI or SID in the URL.");
    }

    const decodedCli = decodeBase64(cli);
    if (!decodedCli) return; // Stop further processing if CLI is invalid

    try {
        const userStatus = await checkUserStatus(decodedCli, sid);
        handleUserStatus(userStatus, decodedCli, sid);
    } catch (error) {
        console.error("Error:", error);
        redirectToErrorPage("Unable to get user status at this time. Try again later.");
    }
}

// Function to check user status
async function checkUserStatus(decodedCli, sid) {
    const response = await fetch('https://be-spin-mtn.ydafrica.com/api/v1/checkstatus', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ msisdn: decodedCli, serviceId: sid }),
    });

    if (!response.ok) {
        if (response.status === 400) {
            const errorData = await response.json();
            console.error('Bad Request:', errorData);
            const message = "Inactive Subscription. Kindly subscribe to enjoy the service.";
            showMessageAndRedirect(message, `http://doi.dep.mtn.co.za/service/7551?ext_ref=123456776`);
            return null; // Stop further execution if user is inactive
        }
        throw new Error("Failed to check user status");
    }

    return await response.json();
}

// Function to handle user status response
function handleUserStatus(data, decodedCli, sid) {
    if (data?.status === 200 && data.data?.State === "Active") {
        window.location.href = "home.html"; // Redirect to index.html
    } else {
        const message = "Inactive Subscription. Kindly subscribe to enjoy the service.";
        showMessageAndRedirect(message, `http://doi.dep.mtn.co.za/service/7551?ext_ref=123456776`);
    }
}

// Function to show a message and redirect after a delay
// function showMessageAndRedirect(message, redirectUrl) {
//     if (!messageContainer || !messageText) {
//         console.error("Message container or text element is missing in the DOM.");
//         return;
//     }

//     messageText.textContent = message;
//     messageContainer.classList.remove('hidden');

//     setTimeout(() => {
//         window.location.href = redirectUrl;
//     }, 5000);
// }


function showMessageAndRedirect(message, redirectUrl) {
    // Create a message container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.padding = '20px';
    container.style.border = '1px solid #ccc';
    container.style.borderRadius = '8px';
    container.style.backgroundColor = '#fff';
    container.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    container.style.textAlign = 'center';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.fontSize = '16px';
    container.style.color = '#333';

    // Add the message to the container
    container.textContent = message;

    // Append the container to the body
    document.body.appendChild(container);

    // Redirect after 5 seconds
    setTimeout(() => {
        window.location.href = redirectUrl;
    }, 5000);
}

// Call the function to handle user access
handleUserAccess();

