import { TerpsichoreDialog } from './terpsichore-dialog.mjs';

window.Terpsichore = {
  available: false,
  dialog: null
};

Hooks.once("init", function() {
  //CONFIG.debug.hooks = true;
  try {
    fetch("/api/terpsichore/version");
    Terpsichore.available = true;
  } catch (e) { }

  console.log("Terpsichore started.")
  if (!Terpsichore.available) {
    console.warn("No backend API detected.");
  }
});

Hooks.on('renderPlaylistDirectory', async (_, html) => {
  if (!Terpsichore.available) return;

  if (!game.user.isGM) return;
  const renderTo = document.querySelector("#playlists>header>.header-actions");

  const container = document.createElement('div');
  container.className = "header-actions action-buttons flexrow";

  const button = document.createElement("button");
  button.type = "button";
  button.class = "terp-btn-import"
  button.innerHTML = "Import from Youtube";
  button.addEventListener('click', async () => {
    if (Terpsichore.dialog) return;

    const dialog = new TerpsichoreDialog();
    Terpsichore.dialog = dialog;
    await dialog.render({ force: true });
  });

  container.appendChild(button);
  renderTo.insertAdjacentElement('afterend', container);
});
