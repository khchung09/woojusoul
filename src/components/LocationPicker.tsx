"use client";

import { useEffect, useRef, useState } from "react";
import { useKakaoMaps } from "@/hooks/useKakaoMaps";
import { MapPin, Loader2, LocateFixed, Search } from "lucide-react";

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

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

export function LocationPicker({ onSelect, initial }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const isLoaded = useKakaoMaps();

  const [selectedData, setSelectedData] = useState<LocationData | null>(initial ?? null);
  const [geocoding, setGeocoding] = useState(false);
  const [geoLoading, setGeoLoading] = useState(!initial);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KakaoPlaceResult[]>([]);
  const [searching, setSearching] = useState(false);

  // 검색 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 1. 마운트 시 현재 위치 요청 (initial 없을 때만)
  useEffect(() => {
    if (initial) return;
    if (!navigator.geolocation) { setGeoLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 5000, maximumAge: 60_000 }
    );
  }, []);

  // 2. SDK + 위치 준비 완료 후 지도 초기화
  useEffect(() => {
    if (!isLoaded || geoLoading) return;
    if (!containerRef.current || mapRef.current) return;

    const { kakao } = window;
    const coords = initial ?? userCoords ?? DEFAULT_CENTER;
    const center = new kakao.maps.LatLng(coords.lat, coords.lng);
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
      placeMarker(latLng);
      geocodeLocation(latLng);
    });
  }, [isLoaded, geoLoading]);

  function placeMarker(latlng: KakaoLatLng) {
    const { kakao } = window;
    if (!markerRef.current) {
      markerRef.current = new kakao.maps.Marker({ map: mapRef.current!, position: latlng, draggable: true });
      kakao.maps.event.addListener(markerRef.current, "dragend", () => {
        geocodeLocation(markerRef.current!.getPosition());
      });
    } else {
      markerRef.current.setPosition(latlng);
    }
  }

  function geocodeLocation(latlng: KakaoLatLng) {
    const { kakao } = window;
    const lat = latlng.getLat();
    const lng = latlng.getLng();
    setGeocoding(true);

    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.coord2RegionCode(lng, lat, (regions, status) => {
      if (status !== kakao.maps.services.Status.OK) { setGeocoding(false); return; }

      const region = regions.find((r) => r.region_type === "H") ?? regions[0];
      const parts = [region.region_1depth_name, region.region_2depth_name, region.region_3depth_name].filter(Boolean);
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

  function handleSearch() {
    if (!searchQuery.trim() || !isLoaded) return;
    setSearching(true);
    const places = new window.kakao.maps.services.Places();
    places.keywordSearch(searchQuery, (results, status) => {
      setSearching(false);
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(results.slice(0, 5));
      } else {
        setSearchResults([]);
      }
    });
  }

  function handleSelectPlace(place: KakaoPlaceResult) {
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);
    const latlng = new window.kakao.maps.LatLng(lat, lng);
    mapRef.current?.setCenter(latlng);
    mapRef.current?.setLevel(4);
    placeMarker(latlng);
    geocodeLocation(latlng);
    setSearchResults([]);
    setSearchQuery(place.place_name);
  }

  function handleCurrentLocation() {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        mapRef.current!.setCenter(latlng);
        placeMarker(latlng);
        geocodeLocation(latlng);
      },
      undefined,
      { timeout: 5000, maximumAge: 0 }
    );
  }

  const showOverlay = !isLoaded || geoLoading;

  return (
    <div className="flex flex-col gap-2">
      {/* 검색창 */}
      <div ref={searchContainerRef} style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--r-md)",
            background: "var(--surface)",
            padding: "8px 12px",
          }}
        >
          <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleSearch(); }
              if (e.key === "Escape") setSearchResults([]);
            }}
            placeholder="장소 또는 주소 검색"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "13px",
              color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
          />
          {searching
            ? <Loader2 size={14} className="animate-spin shrink-0 text-stone-400" />
            : (
              <button
                type="button"
                onClick={handleSearch}
                style={{
                  flexShrink: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Search size={14} />
              </button>
            )
          }
        </div>

        {/* 검색 결과 드롭다운 */}
        {searchResults.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: "4px",
              zIndex: 20,
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--r-md)",
              boxShadow: "var(--shadow-md)",
              overflow: "hidden",
            }}
          >
            {searchResults.map((place, i) => (
              <button
                key={place.id}
                type="button"
                onClick={() => handleSelectPlace(place)}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  padding: "10px 14px",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  borderBottom: i < searchResults.length - 1 ? "1px solid var(--surface-2)" : "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
              >
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {place.place_name}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {place.road_address_name || place.address_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 지도 */}
      <div className="relative w-full rounded-xl border border-red-100" style={{ height: 260, overflow: "hidden" }}>
        {showOverlay && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-stone-100">
            <Loader2 size={20} className="animate-spin text-stone-400" />
            {isLoaded && geoLoading && (
              <span className="text-xs text-stone-400">위치 가져오는 중...</span>
            )}
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />

        {/* 현재 위치로 이동 버튼 */}
        {!showOverlay && (
          <button
            type="button"
            onClick={handleCurrentLocation}
            title="현재 위치로 이동"
            style={{
              position: "absolute",
              bottom: "10px",
              right: "10px",
              zIndex: 10,
              width: "34px",
              height: "34px",
              borderRadius: "var(--r-sm)",
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-secondary)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <LocateFixed size={15} />
          </button>
        )}
      </div>

      {/* 선택된 위치 표시 */}
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
