import 'leaflet/dist/leaflet.css';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { SearchResponse, SotaSearchView, PotaSearchView } from './sotaapp2_response';

import axios from 'axios';
import MountainMarker from './components/MountainMarker';
import ParkMarker from './components/ParkMarker';
import MarkerClusterGroup from 'react-leaflet-cluster';
import ParkRegionLayer from './components/ParkRegionLayer';

// SOTAApp2 Endpoint
const apiUrl = "https://sotaapp2.fly.dev/api/v2/search";

// APIからデータを取得するカスタムフック
// APIからデータを取得するカスタムフック
const useFetchMarkers = (bounds: L.LatLngBounds | null, zoomLevel: number) => {
  const [sotaMarkers, setSotaMarkers] = useState<SotaSearchView[]>([]);
  const [potaMarkers, setPotaMarkers] = useState<PotaSearchView[]>([]);

  useEffect(() => {
    if (bounds) {
      // 四隅の座標をAPIリクエスト用に準備
      const se = bounds.getSouthWest();
      const nw = bounds.getNorthEast();

      let elev = 4000;
      let area = 30;
      if (zoomLevel > 12) {
        elev = 0;
        area = 0;
      } else if (zoomLevel > 9) {
        elev = 800;
        area = 1;
      } else if (zoomLevel > 8) {
        elev = 1000;
        area = 10;
      } else if (zoomLevel > 6) {
        elev = 1500;
        area = 20
      };

      // const api = apiUrl + `?min_elev=${elev}&min_area=${area}&min_lon=${se.lng}&min_lat=${se.lat}&max_lon=${nw.lng}&max_lat=${nw.lat}`;
      const api = apiUrl + `?min_elev=${elev}&min_lon=${se.lng}&min_lat=${se.lat}&max_lon=${nw.lng}&max_lat=${nw.lat}`;

      // Axiosを使用したAPIリクエスト
      axios.get(api)
        .then((response) => {
          const res: SearchResponse = response.data;
          setSotaMarkers(res.sota || []);
          setPotaMarkers(res.pota || []);
        })
        .catch((error) => {
          console.error("マーカー取得失敗しちゃった...", error);
        });
    }
  }, [bounds]);

  return { sotaMarkers, potaMarkers };
};

// MapComponentをもっとスッキリ書いちゃう
const MapComponent: React.FC = () => {
  const map = useMap();
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(map.getZoom());

  // 地図移動イベントのハンドラをuseEffectで設定
  useEffect(() => {
    // 地図の境界とズームレベルを更新する関数
    const updateMapState = () => {
      setBounds(map.getBounds());
      setZoomLevel(map.getZoom());
    };

    // イベントリスナーを追加
    map.on('moveend', updateMapState);
    map.on('zoomend', updateMapState);

    // 初期状態を設定
    updateMapState();

    // クリーンアップ時にイベントリスナーを削除
    return () => {
      map.off('moveend', updateMapState);
      map.off('zoomend', updateMapState);
    };
  }, [map]);

  // マーカーデータを取得
  // マーカーデータを取得
  const { sotaMarkers, potaMarkers } = useFetchMarkers(bounds, zoomLevel);

  // マーカーがなければ何も表示しない
  if ((!sotaMarkers || sotaMarkers.length === 0) && (!potaMarkers || potaMarkers.length === 0)) {
    return null;
  }

  return (
    <>
      {sotaMarkers.map((marker, index) => (
        <MountainMarker
          key={`mountain-${marker.code}-${index}`}
          marker={marker}
          zoomLevel={zoomLevel}
        />
      ))}

      <MarkerClusterGroup>
        {potaMarkers.map((marker, index) => (
          <ParkMarker
            key={`park-${marker.pota}-${index}`}
            marker={marker}
            zoomLevel={zoomLevel}
          />
        ))}
      </MarkerClusterGroup>
    </>
  );
};

// 地図タイルを切り替えできるようにするのとか超簡単よ！
const App: React.FC = () => {
  const [tileType, setTileType] = useState<string>('std'); // デフォルトは標準地図

  const tileUrls = {
    std: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", // 標準地図
    pale: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png", // 淡色地図
    relief: "https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png", // 陰影起伏図
    photo: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg" // シームレス写真
  };

  return (
    <>
      {/* タイルセレクター */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        backgroundColor: 'white',
        padding: '5px',
        borderRadius: '5px'
      }}>
        <select
          value={tileType}
          onChange={(e) => setTileType(e.target.value)}
          style={{ padding: '5px' }}
        >
          <option value="std">標準地図</option>
          <option value="pale">淡色地図</option>
          <option value="relief">陰影起伏</option>
          <option value="photo">写真</option>
        </select>
      </div>

      {/* MapContainer */}
      <MapContainer
        center={[35.67514, 139.66641]}
        zoom={16}
        style={{ height: '100vh' }}
      >
        {/* TopoJSONレイヤー追加 */}
        <ParkRegionLayer url='json/jaffpota-annotated-v22.json' />

        <TileLayer
          attribution="<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
          url={tileUrls[tileType as keyof typeof tileUrls]}
        />
        <MapComponent />
      </MapContainer>
    </>
  );
};

export default App;
