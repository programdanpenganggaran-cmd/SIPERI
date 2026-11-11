const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const code = fs.readFileSync(path.join(__dirname, 'portal-motion.js'), 'utf8');

function setup({ reduced = false, observerSupported = true, animationSupported = true, menuPresent = true } = {}) {
  const animationCalls = [], animations = [], observed = new Set();
  const media = { matches: reduced, addEventListener(type, handler) { this.onchange = handler; } };
  function element(blocked = false) {
    return {
      style: {},
      closest: () => blocked ? {} : null,
      animate(frames, options) {
        animationCalls.push({ element: this, frames, options });
        const listeners = {};
        const animation = { cancelled: false, addEventListener(type, handler) { listeners[type] = handler; }, cancel() { this.cancelled = true; listeners.cancel?.(); }, finish() { listeners.finish?.(); } };
        animations.push(animation);
        return animation;
      }
    };
  }
  const first = element(), second = element(), result = element(true), bot = element(true);
  if (!animationSupported) { delete first.animate; delete second.animate; }
  const summary = { focused: false, focus() { this.focused = true; } };
  const link = {}, outsideLink = {};
  const directory = { open: false, handlers: {}, addEventListener(type, handler) { this.handlers[type] = handler; }, contains(target) { return target === link; }, querySelector() { return summary; } };
  let observer;
  class Observer {
    constructor(callback) { this.callback = callback; observer = this; }
    observe(target) { observed.add(target); }
    unobserve(target) { observed.delete(target); }
    disconnect() { observed.clear(); }
  }
  const document = { getElementById: () => menuPresent ? directory : null, querySelectorAll: () => [first, second, result, bot] };
  const window = { matchMedia: () => media, ...(observerSupported ? { IntersectionObserver: Observer } : {}) };
  vm.runInNewContext(code, { document, window });
  return { directory, summary, link, outsideLink, media, first, second, result, bot, observed, animationCalls, animations, get observer() { return observer; } };
}

const normal = setup();
assert.equal(normal.observed.size, 2);
assert.ok(!normal.observed.has(normal.result));
assert.ok(!normal.observed.has(normal.bot));
assert.deepEqual(normal.first.style, {});
normal.observer.callback([{ target: normal.first, isIntersecting: false }]);
assert.equal(normal.animationCalls.length, 0);
normal.observer.callback([{ target: normal.first, isIntersecting: true }]);
assert.equal(normal.animationCalls.length, 1);
assert.equal(normal.animationCalls[0].options.duration, 420);
assert.equal(normal.animationCalls[0].options.iterations, 1);
assert.equal(normal.animationCalls[0].frames[0].transform, 'translateY(14px)');
assert.ok(!normal.observed.has(normal.first));
normal.observer.callback([{ target: normal.first, isIntersecting: true }]);
assert.equal(normal.animationCalls.length, 1);
normal.media.matches = true;
normal.media.onchange();
assert.equal(normal.observed.size, 0);
assert.equal(normal.animations[0].cancelled, true);
normal.observer.callback([{ target: normal.second, isIntersecting: true }]);
assert.equal(normal.animationCalls.length, 1);
normal.media.matches = false;
normal.media.onchange();
assert.equal(normal.observed.size, 1);
assert.ok(normal.observed.has(normal.second));
normal.observer.callback([{ target: normal.second, isIntersecting: true }]);
assert.equal(normal.animationCalls.length, 2);
normal.animations[1].finish();
normal.media.matches = true;
normal.media.onchange();
assert.equal(normal.animations[1].cancelled, false);

const reduced = setup({ reduced: true });
assert.equal(reduced.observed.size, 0);
reduced.observer.callback([{ target: reduced.first, isIntersecting: true }]);
assert.equal(reduced.animationCalls.length, 0);
assert.deepEqual(reduced.first.style, {});

const unsupported = setup({ observerSupported: false });
assert.equal(unsupported.observer, undefined);
assert.equal(unsupported.animationCalls.length, 0);
assert.deepEqual(unsupported.first.style, {});
const noAnimation = setup({ animationSupported: false });
assert.equal(noAnimation.observed.size, 0);
assert.deepEqual(noAnimation.first.style, {});
unsupported.directory.open = true;
unsupported.directory.handlers.click({ target: { closest: () => unsupported.link } });
assert.equal(unsupported.directory.open, false);
assert.equal(unsupported.summary.focused, false);
unsupported.directory.open = true;
unsupported.directory.handlers.click({ target: { closest: () => unsupported.outsideLink } });
assert.equal(unsupported.directory.open, true);
let prevented = false;
unsupported.directory.handlers.keydown({ key: 'Escape', preventDefault() { prevented = true; } });
assert.equal(prevented, true);
assert.equal(unsupported.directory.open, false);
assert.equal(unsupported.summary.focused, true);
prevented = false;
unsupported.directory.handlers.keydown({ key: 'Escape', preventDefault() { prevented = true; } });
assert.equal(prevented, false);
assert.equal(unsupported.directory.handlers.keyup, undefined);
assert.doesNotThrow(() => setup({ menuPresent: false }));
console.log('PASS motion: progressive visibility, one-shot reveal, reduced-motion changes, unsupported observer, protected results/bot and native directory close/focus.');
