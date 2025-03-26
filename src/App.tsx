import 'leaflet/dist/leaflet.css';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { SearchResponse, SotaSearchView, PotaSearchView } from './sotaapp2_response';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import TerrainIcon from '@mui/icons-material/Terrain';
import ForestIcon from '@mui/icons-material/Forest';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';


import axios from 'axios';
import MountainMarker from './components/MountainMarker';
import ParkMarker from './components/ParkMarker';
import MarkerClusterGroup from 'react-leaflet-cluster';
import ParkRegionLayer from './components/ParkRegionLayer';

// SOTAApp2 Endpoint
const apiUrl = "https://sotaapp2.fly.dev/api/v2/search";

// APIからデータを取得するカスタムフック
const useFetchMarkers = (bounds: L.LatLngBounds | null, zoomLevel: number) => {
  const [sotaMarkers, setSotaMarkers] = useState<SotaSearchView[]>([]);
  const [potaMarkers, setPotaMarkers] = useState<PotaSearchView[]>([]);

  useEffect(() => {
    if (bounds) {
      // 四隅の座標をAPIリクエスト用に準備
      const se = bounds.getSouthWest();
      const nw = bounds.getNorthEast();
      const elev = zoomLevel > 12 ? 0
        : zoomLevel > 9 ? 800
          : zoomLevel > 8 ? 1000
            : zoomLevel > 6 ? 1500
              : 4000;
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
}

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

// Appコンポーネント
const App: React.FC = () => {
  const [tileType, setTileType] = useState<string>('std');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const tileUrls = {
    std: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", // 標準地図
    pale: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png", // 淡色地図
    relief: "https://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png", // 陰影起伏図
    photo: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg" // シームレス写真
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTileChange = (type: string) => {
    setTileType(type);
    handleClose();
  };

  return (
    <>
      <Box sx={{ flexGrow: 1, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <AppBar
          position="static"
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            boxShadow: '0px 1px 5px rgba(0,0,0,0.1)'  // 影薄めにして軽い感じ
          }}
        >
          <Toolbar
            variant="dense"
            sx={{ minHeight: '40px', px: 1 }}  // 高さと左右パディング調整
          >
            <IconButton
              size="small"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 1, color: '#333' }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
            <Typography
              variant="subtitle1"
              component="div"
              sx={{
                flexGrow: 1,
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.9rem',
                fontWeight: 'bold'  // 文字太くしてカッコよく
              }}
            >
              <TerrainIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
              MyACT
              <ForestIcon sx={{ ml: 0.5, fontSize: '1rem' }} />
            </Typography>

            <Button
              color="inherit"
              onClick={handleClick}
              sx={{
                color: '#333',
                py: 0.25,
                px: 1,
                minWidth: 'unset',
                fontSize: '0.8rem'
              }}
              size="small"
            >
              地図タイル
            </Button>
            <Menu
              id="tile-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
            >
              <MenuItem onClick={() => handleTileChange('std')}>標準地図</MenuItem>
              <MenuItem onClick={() => handleTileChange('pale')}>淡色地図</MenuItem>
              <MenuItem onClick={() => handleTileChange('relief')}>陰影起伏</MenuItem>
              <MenuItem onClick={() => handleTileChange('photo')}>写真</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
      </Box>
      {/* MapContainer */}
      <MapContainer
        center={[35.67514, 139.66641]}
        zoom={10}
        style={{ height: 'calc(100vh - 40px)', marginTop: '40px' }}  // 40pxに調整
        zoomControl={true}
      >
        {/* TopoJSONレイヤー追加 */}
        <ParkRegionLayer url='/json/jaffpota-annotated-v22.json' />

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