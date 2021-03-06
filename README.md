# Modality - [See Demo](http://ianrichard.github.io/modality/)

Modality is a front-end framework for modals and popovers. It's fully responsive, works the same across devices and browsers, and is easy to customize for your own use.

The contents of your modals and popovers can be either be directly coded on the page it's called from, or brought in from an external source using AJAX.

I wrote this to be easy enough for my designer friends to use without having to write a line of JavaScript.  And extensive enough for my front-end friends to give me a high-five.

### Usage

These are the main parts that make Modality tick.

```html
<link rel="stylesheet" type="text/css" href="modality-min.css">
...
<a href="#modalContent"   modality-modal>Load Modal</a>
<a href="#popoverContent" modality-popover>Load Popover</a>
...
<div style="display: none;">
    <div id="modalContent"><p>Hello world, from modal content.</p></div>
    <div id="popoverContent"><p>Hello world, from popover content.</p></div>
</div>
...
<script src="modality-min.js"></script>
```

### Beyond the Basics

There are a few things that the [main demo page](http://ianrichard.github.io/modality/) uses that you may want to add back.  These things technically have nothing to do with Modality, but will make it better.

- Box sizing to border-box on all elements
- Padding on the modal / popover content

### Loading Your Modal and Popover Content

By default, the content comes from your calling link's href attribute.  If you're using a button, you can use "modality-content" instead.

If it's a .class or an #ID (or any other valid CSS selector), it will assume your content is already on the page. Otherwise, it'll assume it's coming from an external file.

```html
<!-- DOM -->
<a href="#modalContent" modality-modal>Sample Modal</a>
<button modality-content="#modalContent" modality-modal>Sample Modal</button>
<!-- AJAX -->
<a href="modalAjax.html" modality-modal>Sample Modal</a>
<button modality-content="modalAjax.html" modality-modal>Sample Modal</button>
```

If your content is on the page, the script will move it from where it is (in the DOM), plug it in the modal or popover and then put it back. If that doesn't play nicely with what you're trying to do, you can override that by adding the attribute "modality-content-copy" to the calling link.

### Have It Your Way

Don't like what Modality is giving you out-of-the-box? No problem. It's really simple to customize your modals and popovers by just adding the attribute and value to the invoking link. In the example below, it's overriding the default width value with a custom value of 400 pixels.

```html
<a href="#modalContent" modality-modal modality-width="400">Sample Modal</a>
```

### Configurations for Both Modals and Popovers

| Attribute | Type | Default |  Description |
|:-----------|:------|:------|:------|
| modality-width				| Number | 90% for modal, 300px for popover | Number with optional % as a suffix.  Modal max-width default is 800px and can be changed (see below) |
| modality-height				| Number | auto | Resolves to px |
| modality-close-outside		| Boolean | true | Whether or not selection outside will close it |
| modality-fade-in-duration		| Number | 300 | Number of milliseconds it takes to fade in<sup>*</sup> |
| modality-fade-out-duration	| Number | 300 | Number of milliseconds it takes to fade out<sup>*</sup> |
| modality-pre-load-callback	| Function | none | Method that gets eval'ed pre-load |
| modality-post-close-callback	| Function | none | Method that gets eval'ed post-load |

(*) The fade in / out animations are managed in CSS, but the JS uses the fade duration for blocking and callbacks.

### Modal Only

| Attribute | Type | Default |  Description |
|:-----------|:------|:------|:------|
| modality-max-width			| Number | 800 | Resolves to px |

### Popover Only

| Attribute | Type | Default |  Description |
|:-----------|:------|:------|:------|
| modality-position				| String | 'vertical' | vertical, horizontal, top, bottom, left, right.  The popover will try to load it in this position, but if there isn't enough space, it will try to put it somewhere better |
| modality-link-offset			| Number | Automatically calculated variable offset | Pixel offset from invoking link |

### Closing

It's easy to close the modal without JS.  Simply put this inside the modal content:

```html
<a href="javascript:;" modality-close>Close Modal</a>
```

If you need to trigger closing via JS, you can use one of the following:

```javascript
Modality.closeHighestComponent();
Modality.closeEverything(); // Modality allows infinite stacked instances
```

### Optional Background Styling

If you want the background to do something such as scale back or blur when loading a modal, you can do so by adding an attribute of "modality-background-scale" to the container you want to be scaled.  Modality will add a class of modality-modal-background-blur.  You can do as you wish with that.

### Getting the Highest Instance Via JS
```javascript
Modality.getHighestComponent();
```

### Form Submission

You can fire off a submit event scoped to the modality instance.

```html
<button modality-submit>Submit Form</button>
```

Then listen for 'Modality.Submit' event in the scope of your modality content.  Alternatively, you can manage that yourself and just call Modality.closeHighestInstance()

### A Few Other Notes

Besides ease of use, Modality was made because most modals and popovers don't work well under stress.  Here are a few details that might not be evident by the docs above:

- Gracefully handles window resizing / device rotations.
- When a popover is loaded, it will try its hardest to fit where you want it (if you specified), but if it doesn't fit, it will find the best spot.
- A modal or popover can be loaded inside of another modal or popover infinitely.  Modality sets focus back on the invoking link once a modal or popover is closed.  This helps with accessibility.
- The popover caret offset from the invoking link is dynamically calculated so that it covers just the edge.  This will be different depending on the size of the invoking link.  You can override the default setting, but it was created dynamically so you most likely won't have to worry about it.
- As far as transitions are concerned, the only one by default is to scale and fade in.  If you want to do anything other than that, just tweak the CSS.  For the sake of keeping code lighter, the transitions use CSS, so older versions of IE won't feel as smooth.  If that's important to you, you'll need to crack open the JS and set properties over time instead of adding / removing classes.

### What's Next? ###

- A forked version for React!

Ping me @_ianrichard.
