FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Install X2Go server, LibreOffice, lightweight desktop, SSH, and noVNC for web fallback
RUN apt-get update && apt-get install -y \
    software-properties-common \
    && add-apt-repository -y ppa:x2go/stable \
    && apt-get update && apt-get install -y \
    x2goserver \
    x2goserver-xsession \
    openssh-server \
    libreoffice \
    libreoffice-l10n-fr \
    openbox \
    dbus-x11 \
    fonts-liberation \
    fonts-dejavu-core \
    xvfb \
    x11vnc \
    novnc \
    websockify \
    nextcloud-desktop-cmd \
    ca-certificates \
    supervisor \
    sudo \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Configure SSH
RUN mkdir -p /var/run/sshd \
    && sed -i 's/#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config \
    && sed -i 's/#PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config \
    && echo "X11Forwarding yes" >> /etc/ssh/sshd_config \
    && echo "X11UseLocalhost no" >> /etc/ssh/sshd_config

# Create user
RUN useradd -m -s /bin/bash -G sudo user \
    && echo "user:scalenix" | chpasswd

# Nextcloud sync folder
RUN mkdir -p /home/user/Nextcloud \
    && chown -R user:user /home/user/Nextcloud

# Openbox config: auto-maximize all windows, no decorations
RUN mkdir -p /home/user/.config/openbox
COPY openbox-rc.xml /home/user/.config/openbox/rc.xml
RUN chown -R user:user /home/user/.config

# noVNC symlink
RUN ln -sf /usr/share/novnc/vnc_lite.html /usr/share/novnc/index.html

# Supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 22 6080

CMD ["/start.sh"]
