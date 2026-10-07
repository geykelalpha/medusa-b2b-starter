"use client"

import { TriangleDownMini, TriangleRightMini } from "@medusajs/icons"

/** Expand/collapse button for a tree row. Leaves get a spacer instead. */
const TreeToggle = ({
  hasChildren,
  isCollapsed,
  onToggle,
}: {
  hasChildren: boolean
  isCollapsed: boolean
  onToggle: () => void
}) => {
  if (!hasChildren) {
    return <span className="w-5 shrink-0" />
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isCollapsed ? "Expand" : "Collapse"}
      aria-expanded={!isCollapsed}
      className="w-5 h-5 shrink-0 flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-100"
    >
      {isCollapsed ? <TriangleRightMini /> : <TriangleDownMini />}
    </button>
  )
}

export default TreeToggle
