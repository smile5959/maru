#include <WiFi.h>
#include <WiFiManager.h>
#include <PubSubClient.h>

// 브로커 주소, MQTT 자격증명, WiFi 자격증명은 secrets.h 에 정의한다.
// secrets.h.example 을 secrets.h 로 복사한 뒤 본인 값으로 채워서 사용.
#include "secrets.h"

// ===== MQTT 설정 =====
const int MQTT_PORT = 1883;
const char* DEVICE_ID = "esp32-light-01";

// ===== 핀 설정 =====
const int LED_PIN  = 4;
const int LED_PIN2 = 17;
const int RESET_BTN = 0;

// ===== MQTT 토픽 =====
const char* TOPIC_COMMAND  = "home/light/command";
const char* TOPIC_STATUS   = "home/light/status";
const char* TOPIC_COMMAND2 = "home/light2/command";
const char* TOPIC_STATUS2  = "home/light2/status";

WiFiClient espClient;
PubSubClient client(espClient);

int currentBrightness  = 0;
int currentBrightness2 = 0;

void checkResetButton() {
  if (digitalRead(RESET_BTN) == LOW) {
    Serial.println("BOOT 버튼 감지... 3초 동안 누르면 WiFi 초기화");
    delay(3000);
    if (digitalRead(RESET_BTN) == LOW) {
      Serial.println("WiFi 설정 초기화!");
      WiFiManager wm;
      wm.resetSettings();
      ESP.restart();
    }
  }
}

bool connectToWiFiList() {
  for (int i = 0; i < WIFI_COUNT; i++) {
    if (strlen(WIFI_LIST[i][0]) == 0) continue;
    Serial.print("WiFi 시도: ");
    Serial.println(WIFI_LIST[i][0]);
    WiFi.begin(WIFI_LIST[i][0], WIFI_LIST[i][1]);
    int retry = 0;
    while (WiFi.status() != WL_CONNECTED && retry < 20) {
      delay(500);
      Serial.print(".");
      retry++;
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n연결 완료!");
      Serial.print("IP: ");
      Serial.println(WiFi.localIP());
      return true;
    }
    Serial.println("\n연결 실패, 다음 WiFi 시도...");
    WiFi.disconnect();
  }
  return false;
}

void setBrightness(int brightness) {
  currentBrightness = brightness;
  analogWrite(LED_PIN, brightness);
  Serial.print("LED1 밝기: ");
  Serial.println(brightness);
  String status = "{\"status\":\"" + String(brightness > 0 ? "ON" : "OFF") + "\",\"brightness\":" + String(brightness) + "}";
  client.publish(TOPIC_STATUS, status.c_str());
}

void setBrightness2(int brightness) {
  currentBrightness2 = brightness;
  analogWrite(LED_PIN2, brightness);
  Serial.print("LED2 밝기: ");
  Serial.println(brightness);
  String status = "{\"status\":\"" + String(brightness > 0 ? "ON" : "OFF") + "\",\"brightness\":" + String(brightness) + "}";
  client.publish(TOPIC_STATUS2, status.c_str());
}

void onMessage(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("메시지 수신 [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  String t = String(topic);

  if (t == TOPIC_COMMAND) {
    if (message.indexOf("\"action\":\"ON\"") >= 0) {
      setBrightness(255);
    } else if (message.indexOf("\"action\":\"OFF\"") >= 0) {
      setBrightness(0);
    } else if (message.indexOf("\"action\":\"BRIGHTNESS\"") >= 0) {
      int valueIndex = message.indexOf("\"value\":");
      if (valueIndex >= 0) {
        int brightness = message.substring(valueIndex + 8).toInt();
        setBrightness(constrain(brightness, 0, 255));
      }
    }
  } else if (t == TOPIC_COMMAND2) {
    if (message.indexOf("\"action\":\"ON\"") >= 0) {
      setBrightness2(255);
    } else if (message.indexOf("\"action\":\"OFF\"") >= 0) {
      setBrightness2(0);
    } else if (message.indexOf("\"action\":\"BRIGHTNESS\"") >= 0) {
      int valueIndex = message.indexOf("\"value\":");
      if (valueIndex >= 0) {
        int brightness = message.substring(valueIndex + 8).toInt();
        setBrightness2(constrain(brightness, 0, 255));
      }
    }
  }
}

void connectMQTT() {
  while (!client.connected()) {
    Serial.print("MQTT 연결 중...");
    if (client.connect(DEVICE_ID, MQTT_USER, MQTT_PASS)) {
      Serial.println("연결 완료!");
      client.subscribe(TOPIC_COMMAND);
      client.subscribe(TOPIC_COMMAND2);
    } else {
      Serial.print("실패, 재시도 5초 후... rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN,  OUTPUT);
  pinMode(LED_PIN2, OUTPUT);
  pinMode(RESET_BTN, INPUT_PULLUP);
  analogWrite(LED_PIN,  0);
  analogWrite(LED_PIN2, 0);

  checkResetButton();

  if (!connectToWiFiList()) {
    Serial.println("모든 WiFi 실패 → maru-setup AP 생성");
    WiFiManager wm;
    wm.autoConnect("maru-setup");
  }

  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(onMessage);
  connectMQTT();
}

void loop() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();
  checkResetButton();
}
