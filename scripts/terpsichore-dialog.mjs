const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { PlaylistSound } = foundry.documents;

class TerpsichoreDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    form: {
      handler: TerpsichoreDialog.formHandler,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    window: {
      title: "Media Import"
    }
  }

  static PARTS = {
    form: {
      template: 'modules/terpsichore/templates/dialog-form.hbs'
    },
    footer: {
      template: 'templates/generic/form-footer.hbs'
    }
  }

  static async formHandler(event, form, formData) {
    if (!formData.object['terpsichore.playlist']) {
      return ui.notifications.warn("Please create and select a playlist.");
    }

    if (!formData.object['terpsichore.url']) {
      return ui.notifications.warn("Please enter a media URL. This can be a Youtube URL or other supported services.");
    }

    try {
      const request = new Request(
        '/api/terpsichore/downloadSong', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: formData.object['terpsichore.url']
        })
      });

      ui.notifications.info("Downloading, this may take a few seconds...");
      const payload = await fetch(request);
      const body = await payload.json();
      console.log(body)
      if (payload.ok) {
        const playlist = game.playlists.get(formData.object['terpsichore.playlist']);
        const name = formData.object['terpsichore.name']?.trim() || body.name;
        const _sound = await PlaylistSound.implementation.create(
          {
            channel: 'music',
            description: '',
            name: name,
            path: body.path,
            flags: {}
          },
          {
            parent: playlist
          });
        await this.close();
        ui.notifications.success(`Completed download for ${body.name}, added to playlist ${playlist.name}!`);
      } else {
        ui.notifications.error(`Unable to download: ${body.error}`)
      }
    } catch (e) {
      ui.notifications.error(`Unable to download video due to unspecified error: ${e.message}`)
    }

    console.log(event); console.log(form); console.log(formData);
  }

  async _prepareContext() {
    const context = {};

    context.buttons = [
      { type: "submit", icon: "fa-solid fa-save", label: "Upload" }
    ]

    return context;
  }

  _onClose() {
    Terpsichore.dialog = null;
  }

  async _preparePartContext(partId, context, _options) {
    if (partId !== 'form') return context;

    context['terpsichore'] = {
      playlists: game.playlists.map(playlist => ({ key: playlist._id, label: playlist.name }))
    };

    return context;
  }
}

export { TerpsichoreDialog };
