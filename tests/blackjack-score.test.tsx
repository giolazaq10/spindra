import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BlackjackScore from "../src/components/BlackjackScore";
const ace = { rank: 14, suit: 0 },
  six = { rank: 6, suit: 1 },
  ten = { rank: 10, suit: 2 };
test("Dealer score uses only face-up cards and labels its incomplete total", () => {
  const html = renderToStaticMarkup(
    <BlackjackScore label="Dealer" cards={[six, null]} />,
  );
  assert.match(html, /Dealer: 6/);
  assert.match(html, /Visible cards · hole card hidden/);
  assert.doesNotMatch(html, /Blackjack|Your turn/);
});
test("Player score distinguishes soft totals, blackjack, split 21 and bust", () => {
  const show = (cards, split = false) =>
    renderToStaticMarkup(
      <BlackjackScore label="Your hand 1" cards={cards} split={split} active />,
    );
  assert.match(show([ace, six]), /7 [/] 17/);
  assert.match(show([ace, six]), /Your turn/);
  assert.match(show([ace, ten]), /Blackjack/);
  assert.doesNotMatch(show([ace, ten], true), /Blackjack/);
  assert.match(show([ten, ten, six]), /26/);
  assert.match(show([ten, ten, six]), /Bust/);
});
