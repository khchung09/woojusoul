interface KakaoMaps {
  load(callback: () => void): void;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level?: number }) => KakaoMap;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Marker: new (options: { map?: KakaoMap; position: KakaoLatLng; draggable?: boolean }) => KakaoMarker;
  Circle: new (options: {
    center: KakaoLatLng;
    radius: number;
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    fillColor?: string;
    fillOpacity?: number;
    map?: KakaoMap;
  }) => KakaoCircle;
  InfoWindow: new (options: { content: string; removable?: boolean }) => KakaoInfoWindow;
  CustomOverlay: new (options: {
    position: KakaoLatLng;
    content: string | HTMLElement;
    map?: KakaoMap;
    zIndex?: number;
    xAnchor?: number;
    yAnchor?: number;
  }) => KakaoCustomOverlay;
  ZoomControl: new () => object;
  ControlPosition: { BOTTOMRIGHT: number; TOPRIGHT: number; [key: string]: number };
  event: {
    addListener(target: object, type: string, handler: (...args: unknown[]) => void): void;
    removeListener(target: object, type: string, handler: (...args: unknown[]) => void): void;
  };
  services: {
    Geocoder: new () => KakaoGeocoder;
    Status: { OK: string; ZERO_RESULT: string; ERROR: string };
  };
}

interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  getCenter(): KakaoLatLng;
  getLevel(): number;
  setLevel(level: number): void;
}

interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
  getPosition(): KakaoLatLng;
  setPosition(latlng: KakaoLatLng): void;
  setDraggable(draggable: boolean): void;
}

interface KakaoCircle {
  setMap(map: KakaoMap | null): void;
}

interface KakaoInfoWindow {
  open(map: KakaoMap, marker: KakaoMarker): void;
  close(): void;
}

interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void;
}

interface KakaoGeocoder {
  coord2RegionCode(
    lng: number,
    lat: number,
    callback: (result: KakaoRegionResult[], status: string) => void
  ): void;
  coord2Address(
    lng: number,
    lat: number,
    callback: (result: KakaoAddressResult[], status: string) => void
  ): void;
}

interface KakaoRegionResult {
  region_type: string;
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  region_4depth_name: string;
}

interface KakaoAddressResult {
  road_address: {
    address_name: string;
  } | null;
  address: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
  };
}

interface Window {
  kakao: { maps: KakaoMaps };
}
