import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { PotaSearchView } from '../sotaapp2_response';

interface ParkMarkerProps {
    marker: PotaSearchView;
    zoomLevel: number;
}

const ParkMarker: React.FC<ParkMarkerProps> = ({ marker, zoomLevel }) => {
    // マーカーの色を決める関数
    const getMarkerColor = () => {
        if (marker.date) {
            if (marker.locid?.length === 1) {
                return "#d32f2f"; // 赤色
            }
            return "#ff9800"; // オレンジ
        }
        return "#2e7d32"; // 緑色
    };

    // サイズ決め
    const size = zoomLevel > 14 ? 36 : zoomLevel > 12 ? 32 : zoomLevel > 10 ? 28 : 24;
    const color = getMarkerColor();

    // カスタムSVGアイコン作る
    const parkSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
            <circle cx="12" cy="12" r="10" fill="${color}" />
            <text x="12" y="17" font-family="Arial" font-size="14" fill="white" text-anchor="middle">P</text>
        </svg>
    `;

    // divアイコン作成
    const parkIcon = L.divIcon({
        html: parkSvg,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });

    return (
        <Marker
            position={[marker.lat, marker.lon]}
            icon={parkIcon}
        >
            <Popup>
                <div>
                    <h3>{marker.nameJ || marker.name || "不明な公園"}</h3>
                    {marker.pota && <p>POTA: {marker.pota}</p>}
                    {marker.wwff && <p>JAFF: {marker.wwff}</p>}
                    {marker.date && <p>最終アクティベーション: {marker.date}</p>}
                </div>
            </Popup>
        </Marker>
    );
};

export default ParkMarker;