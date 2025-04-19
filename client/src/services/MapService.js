/* global naver */

class MapService {
  constructor(mapElement, initialPosition = null) {
    if (!window.naver || !window.naver.maps) {
      throw new Error('Naver Maps API가 로드되지 않았습니다.');
    }
    this.mapInstance = new naver.maps.Map(mapElement, {
      center: initialPosition 
        ? new naver.maps.LatLng(initialPosition.latitude, initialPosition.longitude)
        : new naver.maps.LatLng(37.5666805, 126.9784147),
      zoom: 14,
      zoomControl: false,
      smoothZoom: true,
      zoomDuration: 200,
      transition: true,
      transitionDuration: 1000,
    });
    this.currentLocationMarker = null;
    this.lastKnownPosition = null;
     
    // 현재 위치 마커 아이콘 정의
    this.currentLocationIcon = {
      content: `
        <div style="position: relative; width: 40px; height: 40px;">
           <!-- 외부 원 (파란색 테두리) -->
          <div style="
            position: absolute;
             top: 50%;
             left: 50%;
             transform: translate(-50%, -50%);
             width: 24px;
             height: 24px;
             background: rgba(89, 123, 235, 0.2);
             border-radius: 50%;
             animation: pulse 2s infinite;
           "></div>
           
           <!-- 내부 원 (파란색 채움) -->
           <div style="
             position: absolute;
             top: 50%;
             left: 50%;
             transform: translate(-50%, -50%);
             width: 12px;
             height: 12px;
             background: #597BEB;
             border: 2px solid white;
             border-radius: 50%;
             box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
           "></div>
         </div>

        <style>
          @keyframes pulse {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(2);
              opacity: 0;
            }
          }
        </style>
      `,
      anchor: new naver.maps.Point(20, 20)
    };

    naver.maps.Event.addListener(this.mapInstance, 'zoom_changed', () => {
      const zoomLevel = this.mapInstance.getZoom();
      console.log('Current zoom level:', zoomLevel);
    });

    // 초기 위치 설정
    if (!initialPosition && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          this.lastKnownPosition = coords;
          this.setCurrentLocation(coords);
        },
        (error) => {
          console.error('Error getting current position:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }

  getMapInstance() {
    return this.mapInstance;
  }

  updateCurrentLocation(coords) {
    const position = new naver.maps.LatLng(coords.latitude, coords.longitude);
    
    if (!this.currentLocationMarker) {
      this.currentLocationMarker = new naver.maps.Marker({
        position: position,
        map: this.mapInstance,
        icon: this.currentLocationIcon,
        zIndex: 100
      });
    } else {
      this.currentLocationMarker.setPosition(position);
    }
  }

  setCurrentLocation(coords) {
    this.lastKnownPosition = coords;
    const currentPosition = new naver.maps.LatLng(
      coords.latitude,
      coords.longitude
    );

    this.mapInstance.setCenter(currentPosition);

    if (this.currentLocationMarker) {
      this.currentLocationMarker.setMap(null);
    }

    this.currentLocationMarker = new naver.maps.Marker({
      position: currentPosition,
      map: this.mapInstance,
      icon: this.currentLocationIcon,
      zIndex: 100
    });

    naver.maps.Event.addListener(this.currentLocationMarker, 'click', () => {
      const infoWindow = new naver.maps.InfoWindow({
        content: '<div style="padding: 10px; text-align: center;">현재 위치</div>'
      });
      infoWindow.open(this.mapInstance, this.currentLocationMarker);
    });
  }

  createMarker(position, options) {
    return new naver.maps.Marker({
      position: new naver.maps.LatLng(position.latitude, position.longitude),
      map: this.mapInstance,
      ...options
    });
  }

  panTo(coords, zoomLevel) {
    const position = new naver.maps.LatLng(coords.latitude, coords.longitude);
    this.mapInstance.panTo(position, {
      duration: 500,
      easing: 'easeOutCubic'
    });
    
    // 줌 레벨이 제공된 경우 설정
    if (zoomLevel !== undefined) {
      this.mapInstance.setZoom(zoomLevel, true);
    }
  }

  setZoomLevel(level) {
    this.mapInstance.setZoom(level);
  }

  createPolyline(path, options) {
    return new naver.maps.Polyline({
      path,
      map: this.mapInstance,
      ...options
    });
  }

  fitBounds(coordinates) {
    const bounds = coordinates.reduce(
      (bounds, coord) => bounds.extend(new naver.maps.LatLng(coord[1], coord[0])),
      new naver.maps.LatLngBounds()
    );
    
    this.mapInstance.fitBounds(bounds, {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
      duration: 500,
      easing: 'easeOutCubic'
    });
  }

  panToLocation(coords) {
    if (this.mapInstance) {
      const position = new naver.maps.LatLng(coords.latitude, coords.longitude);
      this.mapInstance.panTo(position, {
        duration: 500,
        easing: 'easeInOutCubic'
      });
    }
  }

  setZoom(level, useAnimation = true) {
    if (this.mapInstance) {
      if (useAnimation) {
        this.mapInstance.setZoom(level, true);
      } else {
        this.mapInstance.setZoom(level, false);
      }
    }
  }

  moveToCurrentLocation() {
    // 마지막으로 알고 있는 위치가 있으면 즉시 이동
    if (this.lastKnownPosition) {
      const position = new naver.maps.LatLng(
        this.lastKnownPosition.latitude,
        this.lastKnownPosition.longitude
      );
      this.mapInstance.setCenter(position);
      this.mapInstance.setZoom(17);
    }
    
    // 현재 위치 새로 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          this.lastKnownPosition = coords;
          this.updateCurrentLocation(coords);
          
          const newPosition = new naver.maps.LatLng(coords.latitude, coords.longitude);
          this.mapInstance.setCenter(newPosition);
        },
        (error) => {
          console.error('현재 위치를 가져올 수 없습니다:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 3000,
          maximumAge: 0
        }
      );
    }
  }
}

export default MapService;