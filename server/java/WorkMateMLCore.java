package server.java;

import java.util.*;

public class WorkMateMLCore {
    public static void main(String[] args) {
        if (args.length < 2) {
            System.out.println("{\"error\": \"Invalid arguments. Usage: java WorkMateMLCore <mode> <json_input>\"}");
            return;
        }

        String mode = args[0];
        String input = args[1]; // We'll parse this simple JSON-like structure manually

        Map<String, String> profile = parseSimpleJson(input);

        if ("predict-loan".equals(mode)) {
            LoanPredictor.train("server/data/loan_training_data.csv");
            double probability = LoanPredictor.predict(profile);
            System.out.printf("{\"probability\": %.4f}%n", probability);
        } else if ("recommend-schemes".equals(mode)) {
            SchemeRecommender.loadSchemes("server/data/schemes_large.json");
            int limit = profile.containsKey("limit") ? Integer.parseInt(profile.get("limit")) : 5;
            List<Map<String, Object>> recommendations = SchemeRecommender.recommend(profile, limit);
            outputJsonList(recommendations);
        } else {
            System.out.println("{\"error\": \"Unknown mode: " + mode + "\"}");
        }
    }

    private static Map<String, String> parseSimpleJson(String json) {
        Map<String, String> map = new HashMap<>();
        // Remove braces
        json = json.trim().substring(1, json.length() - 1);
        String[] pairs = json.split(",");
        for (String pair : pairs) {
            String[] kv = pair.split(":");
            if (kv.length == 2) {
                String key = kv[0].trim().replace("\"", "");
                String value = kv[1].trim().replace("\"", "");
                map.put(key, value);
            }
        }
        return map;
    }

    private static void outputJsonList(List<Map<String, Object>> list) {
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < list.size(); i++) {
            Map<String, Object> item = list.get(i);
            sb.append("{");
            int j = 0;
            for (Map.Entry<String, Object> entry : item.entrySet()) {
                sb.append("\"").append(entry.getKey()).append("\": ");
                if (entry.getValue() instanceof String) {
                    sb.append("\"").append(entry.getValue().toString().replace("\"", "\\\"")).append("\"");
                } else {
                    sb.append(entry.getValue());
                }
                if (j < item.size() - 1) sb.append(", ");
                j++;
            }
            sb.append("}");
            if (i < list.size() - 1) sb.append(", ");
        }
        sb.append("]");
        System.out.println(sb.toString());
    }
}
