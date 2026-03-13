FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    xpra \
    xterm \
    bash \
    dbus-x11 \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 14500

CMD ["xpra", "start", "--bind-tcp=0.0.0.0:14500", "--html=on", "--start=xterm", "--no-daemon", "--no-notifications"]
