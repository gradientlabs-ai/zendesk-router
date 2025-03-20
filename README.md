# 🤖 Zendesk Router for Gradient Labs

➡️ **[Script: zendesk-router.js](./zendesk-router.js)**

Route a percentage of your customer support inquiries through Gradient Labs.

## 🔧 Installation

### 1: Widget Keys 🔑

Note the keys of your Zendesk Chat widgets, eg. for the snippet:

```html
<!-- Start of Zendesk Widget script -->
<script id="ze-snippet"
        src="https://static.zdassets.com/ekr/snippet.js?key=abc12673-labd-43a6-842g-fbcf60639b06"></script>
<!-- End of Zendesk Widget script -->
```

The key is the string after `?key=` (e.g., `abc12673-labd-43a6-842g-fbcf60639b06`).

### 2: Installation ⚙️

**Option A: Direct Script Installation**

Replace your current Zendesk widget code with:

```html

<script>
    // Paste the entire contents of zendesk-router.js
</script>

<script>
    ZendeskRouter.init({
        keys: {
            default: 'YOUR_DEFAULT_KEY',                        // Your regular widget key
            gradientLabs: 'GRADIENT_LABS_KEY'                   // Gradient Labs widget key
        },
        percentageForGradientLabs: 30,                          // Send 30% of users to Gradient Labs
        identifier: ZendeskRouter.getPersistentUserId()
    });
</script>
```

**Option B: Separate File Installation**

1. Upload the `zendesk-router.js` file to your website
2. Replace your current Zendesk widget code with:

```html

<script src="path/to/zendesk-router.js"></script>

<script>
    ZendeskRouter.init({
        keys: {
            default: 'YOUR_DEFAULT_KEY',                         // Your regular widget key
            gradientLabs: 'GRADIENT_LABS_KEY'                    // Gradient Labs widget key
        },
        percentageForGradientLabs: 30,                         // Send 30% of users to Gradient Labs
        identifier: ZendeskRouter.getPersistentUserId()
    });
</script>
```

## 🔍 What It Does

This tool allows you to split your customer support traffic between your standard Zendesk support and Gradient Labs'
Zendesk support. It:

- Routes a specified percentage of your support inquiries to Gradient Labs
- Keeps the rest of your inquiries with your default support system
- Ensures each user consistently sees the same support experience

## ⚙️ How It Works

When a user visits your website:

1. The router takes the user's identifier (like their email address)
2. It converts this into a value between 0-100 using a mathematical formula
3. It compares this value to your specified percentage:
    - If the value is below your percentage, the user sees the Gradient Labs widget
    - If the value is at or above your percentage, the user sees your default widget
4. The script then loads the appropriate Zendesk widget automatically