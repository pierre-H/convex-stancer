# Changelog

## 0.0.6

Regenerate the published `dist` artifacts so they match the source fixes for
Stancer v2. Stop sending unsupported `metadata` to `/v2/customers/` and
`/v2/refunds/`, while preserving local Convex metadata storage and customer
linking by `userId`.

## 0.0.5

Fix customer creation against the Stancer API by no longer sending unsupported
`metadata` to `/v2/customers/`, while preserving local user linking and
backfilling `userId` when an existing customer is matched by email.

## 0.0.4

Fix `Buffer is not defined` in non-Node runtimes by using a web-compatible
Basic auth encoding path, and reject `StancerPayments` usage in browsers to
avoid exposing `STANCER_API_KEY`.

## 0.0.3

Update dependancies and merge main

## 0.0.2

Add example

## 0.0.1

Initial version
