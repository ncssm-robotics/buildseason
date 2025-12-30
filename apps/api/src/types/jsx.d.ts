import "hono/jsx";

declare module "hono/jsx" {
  namespace JSX {
    interface HTMLAttributes {
      // HTMX attributes
      "hx-get"?: string;
      "hx-post"?: string;
      "hx-put"?: string;
      "hx-patch"?: string;
      "hx-delete"?: string;
      "hx-trigger"?: string;
      "hx-target"?: string;
      "hx-swap"?: string;
      "hx-push-url"?: string | boolean;
      "hx-select"?: string;
      "hx-select-oob"?: string;
      "hx-indicator"?: string;
      "hx-boost"?: string | boolean;
      "hx-confirm"?: string;
      "hx-disable"?: boolean;
      "hx-disabled-elt"?: string;
      "hx-disinherit"?: string;
      "hx-encoding"?: string;
      "hx-ext"?: string;
      "hx-headers"?: string;
      "hx-history"?: string;
      "hx-history-elt"?: boolean;
      "hx-include"?: string;
      "hx-params"?: string;
      "hx-preserve"?: boolean;
      "hx-prompt"?: string;
      "hx-replace-url"?: string | boolean;
      "hx-request"?: string;
      "hx-sync"?: string;
      "hx-validate"?: boolean;
      "hx-vals"?: string;

      // Alpine.js attributes
      "x-data"?: string;
      "x-init"?: string;
      "x-show"?: string;
      "x-bind"?: string;
      "x-on"?: string;
      "x-text"?: string;
      "x-html"?: string;
      "x-model"?: string;
      "x-modelable"?: string;
      "x-for"?: string;
      "x-transition"?: string;
      "x-effect"?: string;
      "x-ignore"?: boolean;
      "x-ref"?: string;
      "x-cloak"?: boolean;
      "x-teleport"?: string;
      "x-if"?: string;
      "x-id"?: string;

      // Alpine.js x-bind shorthand
      ":class"?: string;
      ":style"?: string;
      ":disabled"?: string;
      ":hidden"?: string;

      // Alpine.js x-on shorthand
      "@click"?: string;
      "@submit"?: string;
      "@change"?: string;
      "@input"?: string;
      "@keyup"?: string;
      "@keydown"?: string;
      "@focus"?: string;
      "@blur"?: string;

      // HTMX Alpine integration events
      "@htmx:before-request"?: string;
      "@htmx:after-request"?: string;
      "@htmx:before-swap"?: string;
      "@htmx:after-swap"?: string;
      "@htmx:after-settle"?: string;
      "@htmx:load"?: string;
    }
  }
}
