If we attach SwipeButtons menu to any elements and we have swipe mode enabled, then the swipe should works since user touched the element with attached menu. Right now it works only from first menu button.

The same situation for hold mode - I should hold the element with attached menu to open the menu. Right now it works only from first menu button.

---

## Agent Analysis

### Current Behavior
- SwipeButtons renders at fixed positions around the node via `position: fixed` buttons
- In click mode: clicking the node → FlowStudio selects it → SwipeButtons appear → works ✓
- In hold/swipe mode: FlowStudio's `onPointerDown` long-press handler runs on the **wrapper div**, not on individual nodes
- The hold timer in `FlowStudio.tsx` (lines 133-159) fires `didLongPressRef.current = true` → opens menu
- But SwipeButtons sub-menus (After/Before/Config) only expand via hover/click on the **button elements themselves**

### Root Cause
The hold gesture on the **node element** currently just selects the node (showing the 3 radial buttons). The sub-menus don't auto-expand. Similarly, in swipe mode, `onMouseEnter` on the node only selects — but the user expects the swipe gesture to flow from node → directly into the sub-menu.

### Required Changes
1. **FlowStudio.tsx**: Forward hold/swipe context to SwipeButtons (e.g., `holdStartedFromNode: boolean`)
2. **SwipeButtons.tsx**: Accept `holdTriggered` prop → auto-expand the "After" sub-menu if hold was initiated on the node
3. **useTouchSwipe**: Track touch origin from the node element, not just from the radial buttons
4. This is a design-level change that requires user input on expected UX flow