import React, { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type * as GeoJSON from 'geojson';
import type { EnrichedBike, ChargingStation, UserLocation, ViewDisplayMode } from '../types/gbfs';
import type { SessionPlan, SessionWaypoint } from '../types/session';
import { formatDistance, formatWalkingTime, getBatteryBadge } from '../utils/distance';

interface MapViewProps {
  bikes: EnrichedBike[];
  chargingStations: ChargingStation[];
  displayMode: ViewDisplayMode;
  userLocation: UserLocation | null;
  effectiveLocation: UserLocation;
  selectedBike: EnrichedBike | null;
  selectedStation: ChargingStation | null;
  sessionPlan?: SessionPlan | null;
  currentStepIndex?: number;
  onSelectBike: (bike: EnrichedBike) => void;
  onSelectStation: (station: ChargingStation) => void;
  onSelectWaypoint?: (wp: SessionWaypoint) => void;
  onRecenterUser: () => void;
  onDeselect?: () => void;
}

const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';
const BIKES_SOURCE_ID = 'lime-bikes';

const CLUSTERS_LAYER = 'lime-clusters';
const CLUSTERS_COUNT_LAYER = 'lime-cluster-count';
const UNCLUSTERED_LAYER = 'lime-unclustered-point';
const PRIORITY_LAYER = 'lime-priority-point';
const SELECTED_BIKE_LAYER = 'lime-selected-bike';

const SESSION_ROUTE_SOURCE_ID = 'lime-session-route';
const SESSION_ROUTE_CASING_LAYER = 'lime-session-route-casing';
const SESSION_ROUTE_LAYER = 'lime-session-route-line';

export const MapView: React.FC<MapViewProps> = ({
  bikes,
  chargingStations,
  displayMode,
  userLocation,
  effectiveLocation,
  selectedBike,
  selectedStation,
  sessionPlan,
  currentStepIndex = 1,
  onSelectBike,
  onSelectStation,
  onSelectWaypoint,
  onRecenterUser,
  onDeselect,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const isMapLoadedRef = useRef<boolean>(false);
  const sessionMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const stationMarkersRef = useRef<mapboxgl.Marker[]>([]);

  // Keep references to latest props
  const bikesRef = useRef(bikes);
  bikesRef.current = bikes;

  const stationsRef = useRef(chargingStations);
  stationsRef.current = chargingStations;

  const onSelectBikeRef = useRef(onSelectBike);
  onSelectBikeRef.current = onSelectBike;

  const onSelectStationRef = useRef(onSelectStation);
  onSelectStationRef.current = onSelectStation;

  const onDeselectRef = useRef(onDeselect);
  onDeselectRef.current = onDeselect;

  // Display rich popup for a bike
  const showBikePopup = (bike: EnrichedBike, mapInstance?: mapboxgl.Map) => {
    const map = mapInstance || mapRef.current;
    if (!map) return;

    if (popupRef.current) popupRef.current.remove();

    const badge = getBatteryBadge(bike.batteryPercent);
    const dist = formatDistance(bike.distanceMeters);
    const walk = formatWalkingTime(bike.walkingMinutes);
    const rangeKm = bike.currentRangeMeters
      ? (bike.currentRangeMeters / 1000).toFixed(1).replace('.', ',')
      : null;

    const popupHtml = `
      <div class="p-4 bg-white min-w-[240px]">
        ${
          bike.isDisabled
            ? `<div class="mb-2.5 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-extrabold text-[11px] tracking-wide flex items-center justify-between shadow-sm">
                <span>⚠️ VÉLO DÉSACTIVÉ</span>
                <span>PRIORITÉ CHARGE</span>
              </div>`
            : bike.needsRecharge
            ? `<div class="mb-2.5 px-2.5 py-1 rounded-lg bg-amber-500 text-white font-extrabold text-[11px] tracking-wide flex items-center justify-between shadow-sm">
                <span>⚡ BATTERIE FAIBLE</span>
                <span>À RECHARGER</span>
              </div>`
            : ''
        }

        <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl ${
              bike.isDisabled ? 'bg-rose-600 text-white' : bike.needsRecharge ? 'bg-amber-500 text-white' : 'bg-[#00DE00] text-slate-950'
            } flex items-center justify-center font-bold text-xs shadow-sm">
              ${bike.isDisabled ? '🛠️' : '⚡'}
            </div>
            <div>
              <span class="font-extrabold text-sm text-slate-900 leading-none">Lime-E</span>
              <p class="text-[11px] text-slate-400 font-mono mt-0.5">#${bike.shortId}</p>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-xs font-bold ${badge.bgColor} ${badge.textColor} border ${badge.borderColor}">
            ${badge.label}
          </span>
        </div>
        
        <div class="space-y-1.5 text-xs text-slate-600 mb-3">
          ${
            bike.distanceMeters !== null
              ? `<div class="flex items-center justify-between font-semibold text-slate-800">
                  <span>Distance :</span>
                  <span>${dist}</span>
                </div>`
              : ''
          }
          ${
            walk
              ? `<div class="flex items-center justify-between text-slate-500">
                  <span>À pied :</span>
                  <span>${walk}</span>
                </div>`
              : ''
          }
          ${
            rangeKm
              ? `<div class="flex items-center justify-between ${bike.needsRecharge ? 'text-amber-600' : 'text-emerald-600'} font-medium">
                  <span>Autonomie :</span>
                  <span>~${rangeKm} km</span>
                </div>`
              : ''
          }
          <div class="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100 text-[11px]">
            <span>Statut :</span>
            <span class="font-bold ${bike.isDisabled ? 'text-rose-600' : 'text-emerald-600'}">
              ${bike.isDisabled ? 'Désactivé (Hors service)' : 'Disponible'}
            </span>
          </div>
        </div>

        <button 
          onclick="navigator.clipboard.writeText('${bike.id}'); alert('ID copié : ${bike.id}');"
          type="button"
          class="block text-center w-full py-2 rounded-xl ${
            bike.isDisabled || bike.needsRecharge
              ? 'bg-slate-900 hover:bg-slate-800 text-white'
              : 'bg-[#00DE00] hover:bg-[#00C700] text-slate-950'
          } font-bold text-xs tracking-tight transition shadow-sm"
        >
          Copier l'identifiant (#${bike.shortId})
        </button>
      </div>
    `;

    popupRef.current = new mapboxgl.Popup({ offset: 14, closeButton: true, maxWidth: '360px' })
      .setLngLat([bike.lon, bike.lat])
      .setHTML(popupHtml)
      .addTo(map);
  };

  // Display rich popup for a Lime Charging / Swap Station
  const showStationPopup = (station: ChargingStation, mapInstance?: mapboxgl.Map) => {
    const map = mapInstance || mapRef.current;
    if (!map) return;

    if (popupRef.current) popupRef.current.remove();

    const dist = formatDistance(station.distanceMeters);
    const walk = formatWalkingTime(station.walkingMinutes);

    const popupHtml = `
      <div class="p-4 bg-white w-[310px] box-border text-slate-900 font-sans">
        <div class="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
          station.isLimeHub ? 'bg-slate-950 text-[#00DE00] font-black' : 'bg-[#00DE00] text-slate-950 font-black'
        } text-[11px] tracking-wide shadow-xs">
          <span>⚡</span>
          <span>${station.isLimeHub ? 'HUB LIME OPÉRATIONS' : 'LIME SWAPSTATION'}</span>
        </div>

        <h3 class="font-extrabold text-sm text-slate-900 leading-tight mb-0.5">
          ${station.name}
        </h3>
        <p class="text-xs text-slate-500 mb-2.5">
          ${station.address}
        </p>

        <!-- Services & Partenariat -->
        <div class="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
          <div class="flex items-center justify-between text-[11px] text-slate-700 font-semibold">
            <span class="text-slate-500 font-normal">Opérateur :</span>
            <span>${station.operator}</span>
          </div>
          <div class="flex flex-wrap gap-1 pt-1 border-t border-slate-200/80">
            ${station.plugTypes
              .map(
                (tag) =>
                  `<span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-medium border border-emerald-200/70">${tag}</span>`
              )
              .join('')}
          </div>
        </div>

        <div class="space-y-1 text-xs text-slate-600 mb-3.5">
          ${
            dist
              ? `<div class="flex items-center justify-between font-semibold text-slate-800">
                  <span>Distance :</span>
                  <span>${dist}</span>
                </div>`
              : ''
          }
          ${
            walk
              ? `<div class="flex items-center justify-between text-slate-500">
                  <span>À pied :</span>
                  <span>${walk}</span>
                </div>`
              : ''
          }
        </div>

        <a 
          href="https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lon}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="block text-center w-full py-2.5 rounded-xl bg-slate-900 hover:bg-[#008700] text-white font-bold text-xs tracking-tight transition shadow-sm"
        >
          Itinéraire vers cette station Lime ➔
        </a>
      </div>
    `;

    popupRef.current = new mapboxgl.Popup({ offset: 14, closeButton: true, maxWidth: '360px' })
      .setLngLat([station.lon, station.lat])
      .setHTML(popupHtml)
      .addTo(map);
  };

  // Helper to sync bikes GeoJSON
  const syncBikesToSource = (bikeList: EnrichedBike[]) => {
    if (!mapRef.current || !isMapLoadedRef.current) return;
    const source = mapRef.current.getSource(BIKES_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: bikeList.map((bike) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [bike.lon, bike.lat],
        },
        properties: {
          id: bike.id,
          shortId: bike.shortId,
          batteryPercent: bike.batteryPercent,
          distanceMeters: bike.distanceMeters,
          currentRangeMeters: bike.currentRangeMeters,
          formFactor: bike.formFactor,
          isDisabled: bike.isDisabled,
          needsRecharge: bike.needsRecharge,
          soonEmpty: Boolean(bike.soonEmpty),
        },
      })),
    };

    source.setData(geojson);
  };

  // Helper to sync physical station HTML totems (striking visual differentiation from bikes)
  const syncStationMarkers = useCallback(() => {
    if (!mapRef.current || !isMapLoadedRef.current) return;
    const map = mapRef.current;

    // Remove existing station markers
    stationMarkersRef.current.forEach((m) => m.remove());
    stationMarkersRef.current = [];

    const showStations = displayMode === 'all' || displayMode === 'stations_only';
    if (!showStations) return;

    chargingStations.forEach((station) => {
      const el = document.createElement('div');
      el.className = 'lime-station-marker';
      el.innerHTML = `
        <div class="lime-station-beacon"></div>
        <div class="lime-station-badge ${station.isLimeHub ? 'is-hub' : ''}">
          <span style="font-size: 13px;">⚡</span>
          <span>${station.isLimeHub ? 'HUB LIME' : 'SWAP'}</span>
        </div>
        <div class="lime-station-pin-tail"></div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectStationRef.current(station);
        showStationPopup(station, map);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([station.lon, station.lat])
        .addTo(map);

      stationMarkersRef.current.push(marker);
    });
  }, [chargingStations, displayMode]);

  // Initialize Mapbox map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

    const initialCenter: [number, number] = [
      effectiveLocation.lon,
      effectiveLocation.lat,
    ];

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLE,
      center: initialCenter,
      zoom: 14,
      pitch: 0,
      attributionControl: true,
    });

    map.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        visualizePitch: true,
      }),
      'top-right'
    );

    map.on('load', () => {
      isMapLoadedRef.current = true;

      // 1. Add Bikes GeoJSON Source with Clustering
      map.addSource(BIKES_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 40,
      });

      // 2. Clusters Circle Layer
      map.addLayer({
        id: CLUSTERS_LAYER,
        type: 'circle',
        source: BIKES_SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#00DE00',
            20,
            '#00B300',
            100,
            '#008700',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,
            20,
            24,
            100,
            30,
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#FFFFFF',
          'circle-opacity': 0.95,
        },
      });

      // 3. Cluster Count Numbers
      map.addLayer({
        id: CLUSTERS_COUNT_LAYER,
        type: 'symbol',
        source: BIKES_SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
        paint: {
          'text-color': '#0F172A',
        },
      });

      // 4. Standard Unclustered Individual Bikes Layer (High battery > 35%)
      map.addLayer({
        id: UNCLUSTERED_LAYER,
        type: 'circle',
        source: BIKES_SOURCE_ID,
        filter: [
          'all',
          ['!', ['has', 'point_count']],
          ['!=', ['get', 'isDisabled'], true],
          ['!=', ['get', 'needsRecharge'], true],
          ['!=', ['get', 'soonEmpty'], true],
        ],
        paint: {
          'circle-color': '#00DE00',
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12,
            5,
            15,
            7,
            18,
            11,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-opacity': 0.9,
        },
      });

      // 5. PRIORITY LAYER for Disabled (Red), Low Battery (Amber), and Soon Empty (Orange)
      map.addLayer({
        id: PRIORITY_LAYER,
        type: 'circle',
        source: BIKES_SOURCE_ID,
        filter: [
          'all',
          ['!', ['has', 'point_count']],
          [
            'any',
            ['==', ['get', 'isDisabled'], true],
            ['==', ['get', 'needsRecharge'], true],
            ['==', ['get', 'soonEmpty'], true],
          ],
        ],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'isDisabled'], true],
            '#EF4444', // Red for disabled
            ['==', ['get', 'needsRecharge'], true],
            '#F59E0B', // Amber for critical recharge (<= 20%)
            '#FB923C', // Bright Orange for soon empty (21% - 35%)
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12,
            7,
            15,
            10,
            18,
            14,
          ],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#FFFFFF',
          'circle-opacity': 1,
        },
      });

      // 7. Selected Bike Highlight Layer
      map.addSource('selected-bike-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: SELECTED_BIKE_LAYER,
        type: 'circle',
        source: 'selected-bike-source',
        paint: {
          'circle-radius': 18,
          'circle-color': 'rgba(239, 68, 68, 0.3)',
          'circle-stroke-width': 3.5,
          'circle-stroke-color': '#EF4444',
        },
      });

      // 8. Session Route Polyline & Casing Layers
      map.addSource(SESSION_ROUTE_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        },
      });

      map.addLayer({
        id: SESSION_ROUTE_CASING_LAYER,
        type: 'line',
        source: SESSION_ROUTE_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0F172A',
          'line-width': 8,
          'line-opacity': 0.85,
        },
      });

      map.addLayer({
        id: SESSION_ROUTE_LAYER,
        type: 'line',
        source: SESSION_ROUTE_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#00DE00',
          'line-width': 4.5,
          'line-opacity': 1,
        },
      });

      // Click on cluster: zoom in smoothly
      map.on('click', CLUSTERS_LAYER, (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [CLUSTERS_LAYER],
        });
        const first = features[0];
        const clusterId = first && 'properties' in first && first.properties ? (first.properties as Record<string, any>).cluster_id : undefined;
        if (clusterId === undefined) return;

        const source = map.getSource(BIKES_SOURCE_ID) as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom === null || zoom === undefined) return;
          if (first && 'geometry' in first && first.geometry.type === 'Point') {
            const coords = (first.geometry as GeoJSON.Point).coordinates;
            map.easeTo({
              center: [coords[0], coords[1]],
              zoom: Math.min(zoom, 17),
              duration: 500,
            });
          }
        });
      });

      // Cursor pointer effects
      const pointerLayers = [CLUSTERS_LAYER, UNCLUSTERED_LAYER, PRIORITY_LAYER];
      pointerLayers.forEach((layer) => {
        map.on('mouseenter', layer, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layer, () => {
          map.getCanvas().style.cursor = '';
        });
      });

      // Click handler for bike points
      const handleBikeClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
        const feature = e.features?.[0];
        if (!feature || !('properties' in feature) || !feature.properties) return;

        const bikeProps = feature.properties as { id: string };
        const targetBike = bikesRef.current.find((b) => b.id === bikeProps.id);
        if (targetBike) {
          onSelectBikeRef.current(targetBike);
          showBikePopup(targetBike, map);
        }
      };

      map.on('click', UNCLUSTERED_LAYER, handleBikeClick);
      map.on('click', PRIORITY_LAYER, handleBikeClick);

      // Click on background map to deselect
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [CLUSTERS_LAYER, UNCLUSTERED_LAYER, PRIORITY_LAYER],
        });
        if (features.length === 0) {
          if (popupRef.current) popupRef.current.remove();
          if (onDeselectRef.current) onDeselectRef.current();
        }
      });

      syncBikesToSource(bikesRef.current);
      syncStationMarkers();
    });

    mapRef.current = map;

    return () => {
      if (popupRef.current) popupRef.current.remove();
      if (userMarkerRef.current) userMarkerRef.current.remove();
      stationMarkersRef.current.forEach((m) => m.remove());
      stationMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
      isMapLoadedRef.current = false;
    };
  }, [syncStationMarkers]);

  // Update GeoJSON source when bikes change
  useEffect(() => {
    syncBikesToSource(bikes);
  }, [bikes]);

  // Update physical station HTML totems when stations or displayMode change
  useEffect(() => {
    syncStationMarkers();
  }, [syncStationMarkers]);

  // Update layer visibility based on displayMode ('all' | 'stations_only' | 'bikes_only')
  useEffect(() => {
    if (!mapRef.current || !isMapLoadedRef.current) return;

    const showBikes = displayMode === 'all' || displayMode === 'bikes_only';
    const bikeVisibility = showBikes ? 'visible' : 'none';

    // Toggle Bike layers
    const bikeLayers = [CLUSTERS_LAYER, CLUSTERS_COUNT_LAYER, UNCLUSTERED_LAYER, PRIORITY_LAYER];
    bikeLayers.forEach((layerId) => {
      if (mapRef.current?.getLayer(layerId)) {
        mapRef.current.setLayoutProperty(layerId, 'visibility', bikeVisibility);
      }
    });
  }, [displayMode]);

  // Update user location marker (pulsing blue dot)
  useEffect(() => {
    if (!mapRef.current) return;

    if (!userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'user-marker-container';

      const pulse = document.createElement('div');
      pulse.className = 'user-marker-pulse';

      const core = document.createElement('div');
      core.className = 'user-marker-core';

      el.appendChild(pulse);
      el.appendChild(core);

      userMarkerRef.current = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([userLocation.lon, userLocation.lat])
        .addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLngLat([userLocation.lon, userLocation.lat]);
    }
  }, [userLocation]);

  // React to selectedBike prop
  useEffect(() => {
    if (!mapRef.current || !isMapLoadedRef.current) return;

    const source = mapRef.current.getSource('selected-bike-source') as mapboxgl.GeoJSONSource | undefined;

    if (!selectedBike) {
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
      return;
    }

    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [selectedBike.lon, selectedBike.lat],
            },
            properties: {},
          },
        ],
      });
    }

    mapRef.current.flyTo({
      center: [selectedBike.lon, selectedBike.lat],
      zoom: 16.5,
      essential: true,
      duration: 1200,
    });

    showBikePopup(selectedBike);
  }, [selectedBike]);

  // React to selectedStation prop
  useEffect(() => {
    if (!mapRef.current || !isMapLoadedRef.current || !selectedStation) return;

    mapRef.current.flyTo({
      center: [selectedStation.lon, selectedStation.lat],
      zoom: 16.5,
      essential: true,
      duration: 1200,
    });

    showStationPopup(selectedStation);
  }, [selectedStation]);

  // Sync Session Plan Route and Numbered Waypoints on Map
  useEffect(() => {
    if (!mapRef.current || !isMapLoadedRef.current) return;
    const map = mapRef.current;

    // Clear previous session markers
    sessionMarkersRef.current.forEach((m) => m.remove());
    sessionMarkersRef.current = [];

    const routeSource = map.getSource(SESSION_ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;

    if (!sessionPlan) {
      if (routeSource) {
        routeSource.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        });
      }
      return;
    }

    // 1. Draw route line
    if (routeSource) {
      routeSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: sessionPlan.routeCoordinates,
        },
      });
    }

    // 2. Fit bounds to route
    if (sessionPlan.routeCoordinates.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      sessionPlan.routeCoordinates.forEach((coord) => bounds.extend(coord));
      map.fitBounds(bounds, {
        padding: { top: 130, bottom: 300, left: 40, right: 40 },
        maxZoom: 16,
        duration: 1000,
      });
    }

    // 3. Create custom waypoint markers
    sessionPlan.waypoints.forEach((wp, idx) => {
      if (wp.type === 'start') return;

      const isCurrent = idx === currentStepIndex;
      const el = document.createElement('div');
      el.className = 'session-waypoint-pin';
      el.style.cursor = 'pointer';

      if (wp.type === 'station') {
        el.innerHTML = `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
            ${isCurrent ? '<div class="absolute -inset-2 rounded-2xl bg-[#00DE00] animate-ping opacity-60"></div>' : ''}
            <div class="relative px-2 py-1 rounded-xl bg-slate-950 text-[#00DE00] border-2 border-[#00DE00] flex items-center justify-center gap-1 font-black text-xs shadow-xl tracking-tight">
              <span>⚡</span>
              <span>${idx}</span>
            </div>
          </div>
        `;
      } else {
        const isDis = wp.isDisabledBike;
        el.innerHTML = `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
            ${isCurrent ? '<div class="absolute -inset-2 rounded-full bg-amber-400 animate-ping opacity-75"></div>' : ''}
            <div class="relative w-8 h-8 rounded-full ${
              isDis ? 'bg-rose-600' : 'bg-amber-500'
            } text-white border-2 border-white flex items-center justify-center font-black text-xs shadow-lg">
              ${idx}
            </div>
          </div>
        `;
      }

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectWaypoint?.(wp);
        map.flyTo({ center: [wp.lon, wp.lat], zoom: 16.5, duration: 800 });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([wp.lon, wp.lat])
        .addTo(map);

      sessionMarkersRef.current.push(marker);
    });
  }, [sessionPlan, currentStepIndex, onSelectWaypoint]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Quick Recenter Floating Button */}
      <button
        type="button"
        onClick={onRecenterUser}
        title="Recentrer la carte"
        className="absolute bottom-28 md:bottom-8 right-4 z-10 p-3 rounded-2xl glass-panel text-slate-800 hover:text-blue-600 shadow-xl shadow-slate-900/10 border border-white/80 active:scale-95 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
      </button>
    </div>
  );
};
