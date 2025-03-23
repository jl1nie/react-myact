import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { SearchResponse, SotaSearchView, PotaSearchView } from './sotaapp2_response';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Leafletのデフォルトマーカーアイコン設定
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

// SOTAApp2 Endpoint
const apiUrl = "https://sotaapp2.fly.dev/api/v2/search";

// APIからデータを取得するカスタムフック
const useFetchMarkers = (bounds: L.LatLngBounds | null, zoomlevel: number) => {
  const [markers, setMarkers] = useState<SotaSearchView[] | undefined>([]);

  useEffect(() => {
    if (bounds) {
      // 四隅の座標をAPIリクエスト用に準備
      const se = bounds.getSouthWest();
      const nw = bounds.getNorthEast();

      let elev = 4000;
      let area = 30;
      if (zoomlevel > 9) {
        elev = 800;
        area = 1;
      } else if (zoomlevel > 8) {
        elev = 1000;
        area = 10;
      } else if (zoomlevel > 6) {
        elev = 1500;
        area = 20
      };

      const api = apiUrl + `?min_elev=${elev}&min_area=${area}&min_lon=${se.lng}&min_lat=${se.lat}&max_lon=${nw.lng}&max_lat=${nw.lat}`;

      // Axiosを使用したAPIリクエスト
      axios.get(api)
        .then((response) => {
          let res: SearchResponse = response.data;
          console.log(res);
          setMarkers(res.sota); // 取得したマーカーを保存
        })
        .catch((error) => {
          console.error("Error fetching markers:", error);
        });
    }
  }, [bounds]);

  return markers;
};

// 地図の四隅の座標を取得してマーカーを更新
const MapComponent: React.FC = () => {
  const map = useMap();
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [zoomlevel, setZoomLevel] = useState<number>(map.getZoom());

  // 地図が動いたときに現在の範囲を取得
  useEffect(() => {
    const updateBounds = () => {
      setBounds(map.getBounds());
      setZoomLevel(map.getZoom())
    };

    map.on('moveend', updateBounds); // 地図移動後に範囲を更新
    updateBounds(); // 初期レンダリング時にも取得

    return () => {
      map.off('moveend', updateBounds);
    };
  }, [map]);

  const markers = useFetchMarkers(bounds, zoomlevel);

  return (
    <>
      {markers?.map((marker, index) => (
        <Marker key={index} position={[marker.lat, marker.lon]}>
          <Popup>{marker.code}/{marker.nameJ}</Popup>
        </Marker>
      ))}
    </>
  );
};

const App: React.FC = () => {
  return (
    <MapContainer
      center={[35.67514, 139.66641]}
      zoom={16}
      style={{ height: '100vh' }}
    >
      <TileLayer
        attribution="<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>|<a href='https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A10-v4_1.html' target='_blank'>国土数値情報自然公園地域データ</a>"
        url="https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"
      />
      <MapComponent />
    </MapContainer>
  );
};

export default App;
