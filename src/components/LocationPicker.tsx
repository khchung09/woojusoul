"use client";

import { useEffect, useRef, useState } from "react";
import { useKakaoMaps } from "@/hooks/useKakaoMaps";
import { MapPin, Loader2 } from "lucide-react";

export interface LocationData {
  lat: number;
  lng: number;
  location: string;
  locationAddress: string;
}

interface Props {
  onSelect: (data: LocationData) => void;
  initial?: LocationData;
}

export function LocationPicker({ onSelect, initial }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const isLoaded = useKakaoMaps();
  const [selectedData, setSelectedData] = useState<LocationData | null>(initial ?? null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return;

    const { kakao } = window;
    const center = initial
      ? new kakao.maps.LatLng(initial.lat, initial.lng)
      : new kakao.maps.LatLng(37.5665, 126.978);

    const map = new kakao.maps.Map(containerRef.current, { center, level: 4 });
    mapRef.current = map;

    if (initial) {
      markerRef.current = new kakao.maps.Marker({ map, position: center, draggable: true });
      kakao.maps.event.addListener(markerRef.current, "dragend", () => {
        geocodeLocation(markerRef.current!.getPosition());
      });
    }

    kakao.maps.event.addListener(map, "click", (e: unknown) => {
      const { latLng } = e as { latLng: KakaoLatLng };
      const { kakao: k } = window;
      if (!markerRef.current) {
        markerRef.current = new k.maps.Marker({ map, position: latLng, draggable: true });
        k.maps.event.addListener(markerRef.current, "dragend", () => {
          geocodeLocation(markerRef.current!.getPosition());
        });
      } else {
        markerRef.current.setPosition(latLng);
      }
      geocodeLocation(latLng);
    });
  }, [isLoaded]);

  function geocodeLocation(latlng: KakaoLatLng) {
    const { kakao } = window;
    const lat = latlng.getLat();
    const lng = latlng.getLng();
    setGeocoding(true);

    const geocoder = new kakao.maps.services.Geocoder();

    geocoder.coord2RegionCode(lng, lat, (regions, status) => {
      if (status !== kakao.maps.services.Status.OK) {
        setGeocoding(false);
        return;
      }

      const region = regions.find((r) => r.region_type === "H") ?? regions[0];
      const parts = [
        region.region_1depth_name,
        region.region_2depth_name,
        region.region_3depth_name,
      ].filter(Boolean);
      const location = parts.length > 0 ? `${parts.join(" ")} 일대` : region.address_name;

      geocoder.coord2Address(lng, lat, (results, addrStatus) => {
        setGeocoding(false);

        const locationAddress =
          addrStatus === kakao.maps.services.Status.OK && results.length > 0
            ? results[0].road_address?.address_name ?? results[0].address.address_name
            : location;

        const data: LocationData = { lat, lng, location, locationAddress };
        setSelectedData(data);
        onSelect(data);
      });
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full overflow-hidden rounded-xl border border-red-100" style={{ height: 260 }}>
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
            <Loader2 size={20} className="animate-spin text-stone-400" />
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2.5">
        <MapPin size={13} className="shrink-0 text-red-400" />
        {geocoding ? (
          <span className="text-xs text-stone-400">주소 검색 중...</span>
        ) : selectedData ? (
          <span className="text-xs font-medium text-stone-700">{selectedData.location}</span>
        ) : (
          <span className="text-xs text-stone-400">지도를 클릭해 위치를 선택해 주세요</span>
        )}
      </div>
    </div>
  );
}
