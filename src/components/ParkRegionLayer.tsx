import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
// @ts-ignore - マジTopojson型定義まともに機能しねぇ
import * as topojson from 'topojson-client';

interface ParkRegionLayerProps {
    url: string;
}

const ParkRegionLayer: React.FC<ParkRegionLayerProps> = ({ url }) => {
    const map = useMap();

    useEffect(() => {
        // TopoJSONをLeafletのGeoJSONに拡張
        const TopoJSON = L.GeoJSON.extend({
            addData: function (data: any) {
                if (data.type === "Topology") {
                    for (const key in data.objects) {
                        if (data.objects.hasOwnProperty(key)) {
                            // 型エラーと戦うのダサいからas anyでゴリ押し
                            const geojson = (topojson as any).feature(data, data.objects[key]);
                            L.GeoJSON.prototype.addData.call(this, geojson);
                        }
                    }
                    return this;
                }
                L.GeoJSON.prototype.addData.call(this, data);
                return this;
            }
        });

        // カスタムレイヤー作成（ここは同じ）
        // @ts-ignore - 型エラーうるせぇ！！！
        const geojson = new TopoJSON(null, {
            style: function () {
                return {
                    color: "#000",
                    opacity: 1,
                    weight: 1,
                    fillColor: '#9fa8da',
                    fillOpacity: 0.3
                };
            },
            onEachFeature: function (feature, layer) {
                layer.on('click', function (e) {
                    const latlng = e.latlng;
                    // 公園クリック時の処理
                    console.log('Park clicked:', {
                        pota: feature.properties.POTA,
                        jaff: feature.properties.JAFF,
                        name: feature.properties.NAME
                    });

                    // ポップアップ作ってその場に表示する
                    const popupContent = `
            <div>
                <h3>${feature.properties.NAME || "不明な公園"}</h3>
                ${feature.properties.POTA ? `<p>POTA: ${feature.properties.POTA}</p>` : ''}
                ${feature.properties.JAFF ? `<p>JAFF: ${feature.properties.JAFF}</p>` : ''}
            </div>
        `;

                    L.popup()
                        .setLatLng(latlng)
                        .setContent(popupContent)
                        .openOn(map);

                    // イベント伝搬を止める
                    L.DomEvent.stop(e);
                });
            }
        });

        // データ取得して追加
        fetch(url)
            .then(response => response.json())
            .then(data => {
                // ここでもany型でゴリ押し！
                geojson.addData(data as any);
                geojson.addTo(map);
            })
            .catch(error => console.error('TopoJSON data loading error:', error));

        // クリーンアップ時にレイヤー削除
        return () => {
            map.removeLayer(geojson);
        };
    }, [map, url]);

    return null;
};

export default ParkRegionLayer;
