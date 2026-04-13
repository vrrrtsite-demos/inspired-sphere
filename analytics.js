// GraphSite sphere analytics — fires events to the Railway API.
// Included in every sphere via <script> tag with data-sphere-id attribute.
// NOTE: document.currentScript is null when defer is used — use querySelector instead.

(function () {
  const script = document.querySelector('script[data-sphere-id]');
  const SPHERE_ID = script?.dataset?.sphereId || 'unknown';
  const API = script?.dataset?.apiUrl || 'https://vrrrt-api-production.up.railway.app/analytics';
  const SPHERE_SECRET = script?.dataset?.sphereSecret || '';

  // Capture UTM/source params from URL
  const params = new URLSearchParams(window.location.search);
  const SOURCE = params.get('src') || 'direct';
  const UID = params.get('uid') || null;

  // Stable session ID for this browser tab
  const SESSION_ID = (() => {
    const key = 'gs_session_' + SPHERE_ID;
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  })();

  /**
   * Track a sphere event.
   * @param {string} eventName - e.g. 'hub_clicked', 'path_started', 'article_clicked'
   * @param {object} properties - event-specific data e.g. { hub_id, hub_label }
   */
  function track(eventName, properties) {
    const payload = JSON.stringify({
      sphere_id: SPHERE_ID,
      session_id: SESSION_ID,
      uid: UID,
      event: eventName,
      source: SOURCE,
      sphere_secret: SPHERE_SECRET,
      properties: properties || {},
    });
    // sendBeacon is non-blocking — never slows down the sphere
    try {
      navigator.sendBeacon(API + '/event', new Blob([payload], { type: 'application/json' }));
    } catch (_) {}
  }

  /**
   * Identify visitor by email (called after email capture form submit).
   * @param {string} email
   * @returns {Promise<string|null>} uid
   */
  async function identify(email) {
    try {
      const res = await fetch(API + '/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sphere_id: SPHERE_ID,
          session_id: SESSION_ID,
          uid: UID,
          email,
        }),
      });
      const data = await res.json();
      return data.uid || null;
    } catch (_) {
      return null;
    }
  }

  // Track page view on load
  track('sphere_viewed');

  window.SphereAnalytics = { track, identify, sessionId: SESSION_ID };
})();
