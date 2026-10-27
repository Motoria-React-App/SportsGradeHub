import { useTranslation } from "@/hooks/useTranslation"

// The official embed uses document.writeln, so keep it in its own document.
const coffeeButtonDocument = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; background: transparent; }
    </style>
  </head>
  <body>
    <script type="text/javascript" src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js" data-name="bmc-button" data-slug="aamritt" data-color="#FFDD00" data-emoji="" data-font="Cookie" data-text="Buy me a coffee" data-outline-color="#000000" data-font-color="#000000" data-coffee-color="#ffffff"></script>
    <style>
      .bmc-btn { width: 100%; min-width: 0; justify-content: center; }
      .bmc-btn-text { width: auto; }
      .bmc-btn:focus-visible { outline: 2px solid #000; outline-offset: -4px; }
    </style>
  </body>
</html>`

export function CoffeeBanner() {
  const { t } = useTranslation()

  return (
    <iframe
      title={t("sidebar.coffeeAccessibleLabel")}
      srcDoc={coffeeButtonDocument}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      className="block h-[60px] w-full shrink-0 rounded-xl border-0 group-data-[collapsible=icon]:hidden"
    />
  )
}
