import type React from "react";

export type AppNotification = {
  id: number;
  title: string;
  desc: string;
  time: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  link: string;
  _eventTime?: number;
};

