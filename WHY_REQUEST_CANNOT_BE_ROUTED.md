# Why "Request Could Not Be Routed" Appears

*Tool and trolley management with tickets, KPIs, Excel import/export.*

## The Cause

This message comes from **Cursor's port forwarding**, not from the app.

Cursor uses VS Code’s `code-tunnel` for port forwarding. That integration is incomplete in Cursor, so port forwarding often fails, even when the app is running correctly.

## What This Means

- The app **is** running in the workspace.
- Cursor’s proxy cannot reliably route external requests to it.
- So when you open the Ports URL or similar, you get "request could not be routed".

## What You Can Try

1. **Simple Browser** (`Ctrl+Shift+P` → **Simple Browser: Show** → `http://127.0.0.1:3000`)  
   Uses Cursor’s internal viewer instead of Ports. May work when Ports does not.

2. **Try `127.0.0.1` instead of `localhost`** in Simple Browser.

3. **Cursor updates**  
   Port forwarding may improve in newer versions.

4. **Copy VS Code’s tunnel** (if allowed by your org):
   - Copy the `bin` folder from VS Code into Cursor’s install directory.
   - See: [Cursor forum – port forwarding](https://forum.cursor.com/t/im-unable-to-forward-a-port/2855).

## Summary

The problem is Cursor’s port-forwarding layer, not your application. Simple Browser is the most promising built-in option if Ports fails.
