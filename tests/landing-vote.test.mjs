import test from "node:test";
import assert from "node:assert/strict";
import { createElement, useSyncExternalStore } from "react";
import { renderToString } from "react-dom/server";
import {
  getLandingVoteSnapshot,
  getServerLandingVoteSnapshot,
  saveLandingVote,
  subscribeToLandingVote,
} from "../features/home/services/landing-vote-store.mjs";

function installWindow(savedVote = null) {
  const listeners = new Map();
  const values = new Map(savedVote ? [["gloria-landing-preview-vote:v1", savedVote]] : []);
  globalThis.window = {
    localStorage: {
      getItem(key) { return values.get(key) ?? null; },
      setItem(key, value) { values.set(key, String(value)); },
    },
    addEventListener(name, listener) {
      const set = listeners.get(name) ?? new Set();
      set.add(listener);
      listeners.set(name, set);
    },
    removeEventListener(name, listener) { listeners.get(name)?.delete(listener); },
    dispatchEvent(event) {
      for (const listener of listeners.get(event.type) ?? []) listener(event);
      return true;
    },
    _values: values,
  };
  return globalThis.window;
}

test("restores a valid saved vote and ignores invalid stored values", () => {
  installWindow("draw");
  assert.equal(getLandingVoteSnapshot(), "draw");
  window._values.set("gloria-landing-preview-vote:v1", "unexpected");
  assert.equal(getLandingVoteSnapshot(), null);
  assert.equal(getServerLandingVoteSnapshot(), null);
  delete globalThis.window;
});

test("uses the same server and hydration snapshot before reading browser storage", () => {
  installWindow("draw");
  function VoteSnapshot() {
    const vote = useSyncExternalStore(
      subscribeToLandingVote,
      getLandingVoteSnapshot,
      getServerLandingVoteSnapshot,
    );
    return createElement("output", null, vote ?? "no vote");
  }

  assert.equal(renderToString(createElement(VoteSnapshot)), "<output>no vote</output>");
  assert.equal(getLandingVoteSnapshot(), "draw");
  assert.equal(getServerLandingVoteSnapshot(), null);
  delete globalThis.window;
});

test("persists a new vote and notifies same-tab subscribers", () => {
  installWindow("home");
  let notifications = 0;
  const unsubscribe = subscribeToLandingVote(() => { notifications += 1; });

  saveLandingVote("away");

  assert.equal(window.localStorage.getItem("gloria-landing-preview-vote:v1"), "away");
  assert.equal(getLandingVoteSnapshot(), "away");
  assert.equal(notifications, 1);
  unsubscribe();
  saveLandingVote("home");
  assert.equal(notifications, 1);
  delete globalThis.window;
});

test("keeps the in-session selection when localStorage is unavailable", () => {
  installWindow();
  window.localStorage.setItem = () => { throw new Error("storage disabled"); };
  saveLandingVote("home");
  assert.equal(getLandingVoteSnapshot(), null);
  delete globalThis.window;
});
