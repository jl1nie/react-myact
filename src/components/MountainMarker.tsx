import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { SotaSearchView } from '../sotaapp2_response';

interface MountainMarkerProps {
    marker: SotaSearchView;
    zoomLevel: number;
}

const MountainMarker: React.FC<MountainMarkerProps> = ({ marker, zoomLevel }) => {
    // 標高に基づいて色を決定
    const getColorByElevation = (elev: number) => {
        if (elev > 1500) return "#c62828";
        if (elev > 1100) return "#ef6c00";
        if (elev > 850) return "#f9a825";
        if (elev > 650) return "#9e9d24";
        if (elev > 500) return "#558b2f";
        return "#1b5e20";
    };

    // ズームレベルに応じてサイズ変更
    const getSize = () => {
        if (zoomLevel > 14) return 24;
        if (zoomLevel > 12) return 20;
        if (zoomLevel > 10) return 16;
        return 12;
    };

    const size = getSize();
    const fillColor = getColorByElevation(marker.alt);
    const borderColor = "#4e342e";

    // 三角形のSVGを作成
    const mountainIcon = L.divIcon({
        html: `
      <svg width="${size}" height="${size}" viewBox="0 0 100 100">
        <polygon points="50,10 90,90 10,90" style="fill:${fillColor};stroke:${borderColor};stroke-width:5" />
        <text x="50" y="70" font-family="Arial" font-size="35" fill="white" text-anchor="middle" dominant-baseline="middle">${marker.pts || ''}</text>
      </svg>
    `,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });

    return (
        <Marker
            position={[marker.lat, marker.lon]}
            icon={mountainIcon}
        >
            <Popup>
                {marker.code}/{marker.nameJ}<br />
                標高: {marker.alt}m<br />
                ポイント: {marker.pts}
            </Popup>
        </Marker>
    );
};

export default MountainMarker;