import { useEffect, useRef, useCallback, useState } from 'react';
import { Client, IFrame, IMessage } from '@stomp/stompjs';
import { Notification } from '../types/index';
import { useAuth } from '../context/AuthContext';

interface UseWebSocketReturn {
  connected: boolean;
  latestNotification: Notification | null;
}

/**
 * Real-time notification hook using STOMP over native WebSocket.
 * SockJS is not used here to stay compatible with Vite's ESM environment.
 * The Spring backend's WebSocket endpoint supports both SockJS and native WS.
 */
export function useWebSocket(onNotification?: (n: Notification) => void): UseWebSocketReturn {
  const { user, token } = useAuth();
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  const handleMessage = useCallback((msg: IMessage) => {
    try {
      const notification: Notification = JSON.parse(msg.body);
      setLatestNotification(notification);
      onNotification?.(notification);
    } catch (e) {
      console.warn('Failed to parse WebSocket notification', e);
    }
  }, [onNotification]);

  useEffect(() => {
    if (!user || !token) return;

    const wsUrl = `ws://localhost:8080/ws/websocket`;

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: (_frame: IFrame) => {
        setConnected(true);
        client.subscribe(`/user/${user.id}/queue/notifications`, handleMessage);
        console.debug('WebSocket connected for user', user.id);
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.warn('STOMP error:', frame.headers['message']);
        setConnected(false);
      },
      onWebSocketError: (event) => {
        // WebSocket not available (backend not running) — fail silently
        console.debug('WebSocket connection failed (backend may be offline):', event);
        setConnected(false);
      },
    });

    try {
      client.activate();
      clientRef.current = client;
    } catch (e) {
      console.debug('WebSocket activation failed:', e);
    }

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [user?.id, token, handleMessage]);

  return { connected, latestNotification };
}
