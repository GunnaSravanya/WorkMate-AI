package server.java;

import java.nio.file.*;
import java.util.*;
import java.util.regex.*;

public class SchemeRecommender {
    private static List<Map<String, String>> schemes = new ArrayList<>();

    public static void loadSchemes(String jsonPath) {
        try {
            String content = new String(Files.readAllBytes(Paths.get(jsonPath)));
            // Simple manual JSON array parsing for the specific structure
            Pattern p = Pattern.compile("\\{(.*?)\\}", Pattern.DOTALL);
            Matcher m = p.matcher(content);
            while (m.find()) {
                Map<String, String> scheme = new HashMap<>();
                String obj = m.group(1);
                
                // Extract specific fields using regex
                extractField(obj, "scheme_name", scheme);
                extractField(obj, "name", scheme);
                extractField(obj, "state", scheme);
                extractField(obj, "category", scheme);
                extractField(obj, "description", scheme);
                extractField(obj, "short_description", scheme);
                extractField(obj, "eligibility", scheme);
                extractField(obj, "threshold", scheme);

                if (!scheme.isEmpty()) schemes.add(scheme);
            }
        } catch (Exception e) {
            System.err.println("Error loading schemes in Java: " + e.getMessage());
        }
    }

    private static void extractField(String obj, String field, Map<String, String> data) {
        Pattern p = Pattern.compile("\"" + field + "\":\\s*\"(.*?)\"(,|\n|\\})", Pattern.DOTALL);
        Matcher m = p.matcher(obj);
        if (m.find()) {
            data.put(field, m.group(1).replace("\\\"", "\""));
        } else {
            // Check for numeric threshold
            Pattern numP = Pattern.compile("\"" + field + "\":\\s*(\\d+)", Pattern.DOTALL);
            Matcher numM = numP.matcher(obj);
            if (numM.find()) {
                data.put(field, numM.group(1));
            }
        }
    }

    public static List<Map<String, Object>> recommend(Map<String, String> userProfile, int limit) {
        List<Map<String, Object>> scored = new ArrayList<>();

        for (Map<String, String> scheme : schemes) {
            int score = calculateScore(scheme, userProfile);
            Map<String, Object> result = new HashMap<>(scheme);
            result.put("score", score);
            scored.add(result);
        }

        Collections.sort(scored, (a, b) -> (Integer) b.get("score") - (Integer) a.get("score"));
        return scored.subList(0, Math.min(limit, scored.size()));
    }

    private static int calculateScore(Map<String, String> scheme, Map<String, String> profile) {
        int score = 30; // Base score
        
        String schemeName = (scheme.get("scheme_name") != null ? scheme.get("scheme_name") : scheme.get("name") != null ? scheme.get("name") : "").toLowerCase();
        String desc = (scheme.get("description") != null ? scheme.get("description") : scheme.get("short_description") != null ? scheme.get("short_description") : "").toLowerCase();
        
        // Income comparison
        if (profile.containsKey("salary") && scheme.containsKey("threshold")) {
            try {
                double salary = Double.parseDouble(profile.get("salary"));
                double threshold = Double.parseDouble(scheme.get("threshold"));
                if (salary <= threshold) score += 30;
                else if (salary <= threshold * 1.2) score += 10;
            } catch (Exception e) {}
        }

        // Location match
        if (profile.containsKey("location") && scheme.containsKey("state")) {
            if (profile.get("location").toLowerCase().contains(scheme.get("state").toLowerCase())) {
                score += 20;
            }
        }

        // Skill match
        if (profile.containsKey("skills")) {
            String[] skills = profile.get("skills").split(",");
            for (String skill : skills) {
                if (schemeName.contains(skill.trim().toLowerCase()) || desc.contains(skill.trim().toLowerCase())) {
                    score += 10;
                }
            }
        }

        return Math.min(100, score);
    }
}
