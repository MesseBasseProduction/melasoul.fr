import { Color, Solver } from './js/FilterGenerator.js';
import './bw.scss';


const APP_VERSION = '1.3.0';
const APP_NAME = 'Melasoul.fr';
const DEBUG = false;


class BW {


  constructor() {
    this._lang = localStorage.getItem('website-lang');
    if (this._lang === null) {
      this._lang = (['fr', 'es', 'de', 'en', 'it'].indexOf(navigator.language.substring(0, 2)) !== -1) ? navigator.language.substring(0, 2) : 'en';
      localStorage.setItem('website-lang', this._lang);
    }
    this._nls = null;
    this._band = null;
    this._mainScroll = null;

    if (DEBUG === true) { console.log(`${APP_NAME} v${APP_VERSION} : Begin website initialization`); }
    this._initLang()
      .then(this._fetchBandInfo.bind(this))
      .then(this._init.bind(this))
      .then(this._buildPage.bind(this))
      .then(this._events.bind(this))
      .catch(err => { // Error are displayed even if DEBUG is set to false, to notify end user to contact support
        console.error(`${APP_NAME} v${APP_VERSION} : Fatal error during initialization, please contact support :\n`, err);
      })
      .finally(() => {
        if (DEBUG === true) { console.log(`${APP_NAME} v${APP_VERSION} : Website initialization done`); }
      });
  }


  _initLang() {
    if (DEBUG === true) { console.log(`1. Fetch language keys with ${this._lang} locale`); }
    return new Promise((resolve, reject) => {
      fetch(`assets/json/${this._lang}.json`).then(data => {
        data.json().then(nlsKeys => {
          if (DEBUG === true) { console.log(`2. Language keys successfully retrieven`); }
          this._nls = nlsKeys;

          const select = document.getElementById('lang-select');
          for (let i = 0; i < select.children.length; ++i) {
            select.children[i].innerHTML = this._nls.lang[select.children[i].value];
            if (select.children[i].value === this._lang) {
              select.children[i].setAttribute('selected', true);
            }
          }
          
          select.addEventListener('change', e => {
            localStorage.setItem('website-lang', e.target.value);
            window.location.reload();
          });

          resolve();
        }).catch(err => {
          if (DEBUG === true) { console.log(`Err. Can't parse language keys, the JSON file may be is invalid`); }
          reject(err);
        });
      }).catch(err => {
        if (DEBUG === true) { console.log(`Err. Couldn't retrieve language keys`); }
        reject(err);
      });
    });
  }


  _fetchBandInfo() {
    if (DEBUG === true) { console.log(`1. Fetch band links and releases`); }
    return new Promise((resolve, reject) => {
      fetch(`assets/json/band.json`).then(data => {
        data.json().then(bandKeys => {
          if (DEBUG === true) { console.log(`2. Links and releases successfully retrieven`); }
          this._band = bandKeys;
          resolve();
        }).catch(err => {
          if (DEBUG === true) { console.log(`Err. Can't parse language keys, the JSON file may be is invalid`); }
          reject(err);
        });
      }).catch(err => {
        if (DEBUG === true) { console.log(`Err. Couldn't retrieve language keys`); }
        reject(err);
      });
    });
  }


  _init() {
    if (DEBUG === true) { console.log(`5. Updatde css to take color and style value into account`); }
    return new Promise((resolve, reject) => {
      // Only update cs variables if precised in band.json, keep default otherwise
      if (this._band.styles) {
        document.documentElement.style.setProperty('--color-main', this._band.styles.mainColor);
        document.documentElement.style.setProperty('--gradientStart', this._band.styles.gradientStart);
        document.documentElement.style.setProperty('--gradientEnd', this._band.styles.gradientEnd);
        // Create filter css rule from main color color
        const rgb = Color.hexToRgb(this._band.styles.mainColor);
        const color = new Color(rgb[0], rgb[1], rgb[2]);
        const solver = new Solver(color);
        const result = solver.solve();
        document.documentElement.style.setProperty('--imageFilter', result.filter);
        resolve();
      } else {
        reject(new Error('Not styles found in JSON file'));
      }
    });
  }


  _buildPage() {
    if (DEBUG === true) { console.log(`6. Build HTML DOM depending on the page type`); }
    return new Promise((resolve, reject) => {
      if (document.body.dataset.type === 'index') {
        this._buildIndexPage();
      } else {
        if (DEBUG === true) { console.log(`Err. Unknown page type to init the website with`); }
        reject(new Error('Invalid <body> type. Should be only index'));
      }
      resolve();
    });
  }


  _buildIndexPage() {
    if (DEBUG === true) { console.log(`6. Init website with the artist main page`); }

    // Page specific nls
    document.querySelector('#band-name').innerHTML = this.applyLangOnAsset(this._band.shortBio);
    document.querySelector('#band-picture').src = `./assets/img/artists/${this._band.bandPicture}`;
    document.querySelector('#band-desc').innerHTML = this.applyLangOnAsset(this._band.bio);

    document.querySelector('#musicians-section').innerHTML = this._nls.musicians;
    document.querySelector('#musicians-description').innerHTML = this.applyLangOnAsset(this._band.team);
    document.querySelector('#events-section').innerHTML = this._nls.events;
    document.querySelector('#events-opt-a').innerHTML = this.applyLangOnAsset(this._band.events.optA);
    document.querySelector('#events-opt-b').innerHTML = this.applyLangOnAsset(this._band.events.optB);
    document.querySelector('#works-section').innerHTML = this._nls.works;
    document.querySelector('#works-description').innerHTML = this.applyLangOnAsset(this._band.setDescription);
    document.querySelector('#find-us-section').innerHTML = this._nls.findUs;
    document.querySelector('#medias-section').innerHTML = this._nls.medias;
    document.querySelector('#current-year').innerHTML = new Date().getFullYear();

    if (this._band.members.length > 0) {
      // Iterate through band members
      for (let i = 0; i < this._band.members.length; ++i) {
        const container = document.createElement('DIV');
        container.dataset.artist = this._band.members[i].fullName;
        const picture = document.createElement('IMG');
        picture.src = `./assets/img/artists/${this._band.members[i].picture}`;

        let roles = '';
        for (let j = 0; j < this._band.members[i].roles.length; ++j) {
          roles += this._nls.roles[this._band.members[i].roles[j]];
          if (j + 1 < this._band.members[i].roles.length) {
            roles += ', ';
          }
        }

        const label = document.createElement('P');
        label.innerHTML = `
          ${this._band.members[i].fullName}
          <span>${roles}</span>
        `;
        container.addEventListener('click', this._artistModal.bind(this, this._band.members[i]));
        container.appendChild(picture);
        container.appendChild(label);
        document.getElementById('artists').appendChild(container);
      }
    }

    if (this._band.setlists.length > 0) {
      const header = document.createElement('DIV');
      header.classList.add('header');
      header.innerHTML = `<p>${this._nls.setlists.name}</p><p>${this._nls.setlists.title}</p><p>${this._nls.setlists.author}</p>`;
      document.querySelector('#works').appendChild(header);

      for (let i = 0; i < this._band.setlists.length; ++i) {
        const container = document.createElement('DIV');
        const setName = document.createElement('P');
        setName.innerHTML = this.applyLangOnAsset(this._band.setlists[i].name);

        const setTitles = document.createElement('P');
        const setAuthors = document.createElement('P');
        for (let j = 0; j < this._band.setlists[i].titles.length; ++j) {
          setTitles.innerHTML += `<p>${this._band.setlists[i].titles[j][0]}</p>`;
          setAuthors.innerHTML += `<p>${this._band.setlists[i].titles[j][1]}</p>`;
        }

        container.appendChild(setName);
        container.appendChild(setTitles);
        container.appendChild(setAuthors);
        document.querySelector('#works').appendChild(container);
      }
    }

    if (this._band.links.length > 0) {
      // Iterate over link to create link content
      for (let i = 0; i < this._band.links.length; ++i) {
        document.querySelector('#link-container').innerHTML += `
        <a href="${this._band.links[i].url}" class="link" target="_blank" rel="noopener noreferrer">
          <img src="assets/img/logo/${this._band.links[i].type}.svg" width="25px">
          <p>${this._band.links[i].name}</p>
        </a>
        `;
      }
    }

    if (this._band.medias.length > 0) {
      // Iterate through band's medias
      for (let i = 0; i < this._band.medias.length; ++i) {
        let container = null;
        if (this._band.medias[i].type === 'iframe') {
          container = document.createElement('IFRAME');
          container.title = this._band.medias[i].title;
          container.src = this._band.medias[i].link;
          container.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups');
          container.setAttribute('frameborder', '0');
          container.setAttribute('allowfullscreen', '1');
        } else if (this._band.medias[i].type === 'image') {
          container = document.createElement('IMG');
          container.src = this._band.medias[i].link;
        }
        document.getElementById('medias').appendChild(container);
      }
    }

    // Now build page scroll
    this._mainScroll = new window.ScrollBar({
      target: document.getElementById('content-wrapper'),
      minSize: 200,
      style: {
        color: this._band.styles.mainColor
      }
    });
    // Hide loading overlay
    document.getElementById('loading-overlay').style.opacity = '0';
    // Force render after scroll creation to make scrollbar properly resized to content
    setTimeout(() => {
      this._mainScroll.updateScrollbar();
    }, 200);
    // Display none on loading overlay when animation fade out is finished
    setTimeout(() => {
      document.getElementById('loading-overlay').style.display = 'none';
    }, 1200);
  }


  _events() {
    // Blur modal event
    document.getElementById('modal-overlay').addEventListener('click', this._closeModal.bind(this));
  }


  // Utils for main page


  _artistModal(artist) {
    const overlay = document.getElementById('modal-overlay');
    // Open modal event
    fetch(`assets/html/modal/biomodal.html`).then(data => {
      overlay.style.display = 'flex';
      data.text().then(htmlString => {
        const container = document.createRange().createContextualFragment(htmlString);
        container.querySelector('#artist-name').innerHTML = artist.fullName;
        container.querySelector('#artist-picture').src = `./assets/img/artists/${artist.picture}`;
        for (let i = 0; i < artist.roles.length; ++i) {
          container.querySelector('#artist-roles').innerHTML += this._nls.roles[artist.roles[i]];
          if (i + 1 < artist.roles.length) {
            container.querySelector('#artist-roles').innerHTML += ', ';
          }
        }

        if (artist.range.length > 0) {
          container.querySelector('#artist-roles').innerHTML += ` ${this._nls.since} ${artist.range.split('-')[0]}`;
        }

        container.querySelector('#artist-bio').innerHTML = this.applyLangOnAsset(artist.bio);
        container.querySelector('#close-modal-button').innerHTML = this._nls.close;
        overlay.appendChild(container);
        requestAnimationFrame(() => overlay.style.opacity = 1);
      });
    }).catch(e => console.error(e));
  }


  _closeModal(e) {
    if (e.target.id !== 'modal-overlay' && e.target.className !== 'close-modal') {
      return;
    }

    const overlay = document.getElementById('modal-overlay');
    if (overlay.style.display === 'flex') {
      overlay.style.opacity = 0;
      setTimeout(() => {
        overlay.innerHTML = '';
        overlay.style = '';
      }, 400);
    }
  }


  // Global Utils


  applyLangOnAsset(asset) {
    if (asset[this._lang]) {
      return asset[this._lang];
    } else {
      const keys = Object.keys(asset);
      return asset[keys[0]];
    }
  }


  formatDate(date, lang) {
    const dateObj = new Date(date);
    const formatter = new Intl.DateTimeFormat(lang, { month: 'long' });
    const month = formatter.format(dateObj);
    if (lang === 'en') {
      return `${month} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
    } else {
      return `${dateObj.getDate()} ${this.capitalizeFirstLetter(month)} ${dateObj.getFullYear()}`;
    }
  }


  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }


}


export default BW;
