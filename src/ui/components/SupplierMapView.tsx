"use client";

import dynamic from "next/dynamic";
import type { GeoPoint } from "@/domain/types";

// Leaflet touches `window`, so the real map only loads on the client. This thin
// wrapper is the public entry point; consumers import it, never SupplierMap.
const SupplierMap = dynamic(() => import("./SupplierMap"), {
  ssr: false,
  loading: () => (
    <div className="grid place-content-center rounded-[14px] border border-hairline bg-surface/50 text-xs text-tertiary" style={{ height: 200 }}>
      Đang tải bản đồ…
    </div>
  ),
});

export function SupplierMapView(props: {
  location?: GeoPoint;
  editable?: boolean;
  onChange?: (p: GeoPoint) => void;
  height?: number;
  className?: string;
}) {
  return <SupplierMap {...props} />;
}
