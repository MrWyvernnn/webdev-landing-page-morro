/**
 * Confirmation is a button, not a bare GET. Mail scanners and link previewers
 * fetch every URL in a message; if the GET performed the confirmation, a bot
 * could add an address its owner never agreed to. The page reads the token from
 * its own URL and POSTs it only when a person presses the button.
 */

const STYLES = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100dvh; display: grid; place-items: center;
    padding: 24px; background: #000000; color: #EFE7D6;
    font: 16px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  main { width: 100%; max-width: 440px; }
  .kicker { margin: 0 0 16px; font-size: 12px; letter-spacing: 0.02em; color: #8F8778; }
  h1 { margin: 0 0 16px; font-size: 28px; line-height: 1.15; font-weight: 600; letter-spacing: -0.02em; }
  p { margin: 0 0 20px; color: #CFC6B4; }
  button {
    width: 100%; min-height: 48px; border: 0; border-radius: 10px;
    background: #EFE7D6; color: #000000; font: inherit; font-weight: 600; cursor: pointer;
  }
  button:disabled { opacity: 0.6; cursor: default; }
  button:focus-visible { outline: 2px solid #E8C58F; outline-offset: 3px; }
  .note { margin: 20px 0 0; font-size: 13px; color: #8F8778; }
  a { color: #EFE7D6; }
`;

function shell(title: string, body: string, script: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${title}</title>
<style>${STYLES}</style>
</head>
<body>
<main>${body}</main>
<script>${script}</script>
</body>
</html>`;
}

const ACTION_SCRIPT = (endpoint: string) => `
(function () {
  var token = new URLSearchParams(location.search).get('t') || '';
  var button = document.getElementById('go');
  var message = document.getElementById('msg');
  var note = document.getElementById('note');
  if (!token) {
    button.hidden = true;
    message.textContent = 'This link is missing its code. Use the link in the email exactly as it arrived.';
    return;
  }
  button.addEventListener('click', function () {
    button.disabled = true;
    button.textContent = 'Working…';
    fetch('${endpoint}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token })
    })
      .then(function (response) { return response.json(); })
      .then(function (data) {
        if (data && data.ok) {
          message.textContent = data.state === 'already'
            ? 'This address was already confirmed. Nothing else to do.'
            : 'Done. We will send your invite to this address when the beta opens.';
          button.hidden = true;
          if (note) note.textContent = 'You can close this tab.';
          history.replaceState(null, '', location.pathname);
        } else if (data && data.error === 'expired') {
          message.textContent = 'That link expired. Ask for a fresh one on the site and we will send another.';
          button.hidden = true;
        } else {
          message.textContent = 'That link is not valid. Ask for a fresh one on the site.';
          button.hidden = true;
        }
      })
      .catch(function () {
        message.textContent = 'We could not reach the server. Check your connection and try again.';
        button.disabled = false;
        button.textContent = 'Try again';
      });
  });
})();
`;

export function confirmationPage(): string {
  return shell(
    "Confirm your Morro spot",
    `<p class="kicker">Morro · closed Android beta</p>
     <h1>Confirm this address?</h1>
     <p id="msg">One tap and we will keep your place. We only send your beta invite after this.</p>
     <button id="go" type="button">Confirm my spot</button>
     <p class="note" id="note">The link works once and expires in 48 hours.</p>`,
    ACTION_SCRIPT("/api/confirm"),
  );
}

export function unsubscribePage(): string {
  return shell(
    "Leave the Morro list",
    `<p class="kicker">Morro · mailing list</p>
     <h1>Leave the list?</h1>
     <p id="msg">We will delete your address from the waitlist and send nothing further.</p>
     <button id="go" type="button">Remove my address</button>
     <p class="note" id="note">You will not get a confirmation email, by design.</p>`,
    ACTION_SCRIPT("/api/unsubscribe"),
  );
}
