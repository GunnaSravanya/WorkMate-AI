package server.java;

import java.io.*;
import java.util.*;

public class LoanPredictor {
    private static Map<String, Double> counts = new HashMap<>();
    private static int totalYes = 0;
    private static int totalNo = 0;
    private static int totalSamples = 0;

    public static void train(String csvPath) {
        try (BufferedReader br = new BufferedReader(new FileReader(csvPath))) {
            String line;
            br.readLine(); // Skip header
            while ((line = br.readLine()) != null) {
                String[] values = line.split(",");
                if (values.length < 12) continue;

                int status = (int) Double.parseDouble(values[11]); 
                if (status == 1) totalYes++;
                else totalNo++;
                totalSamples++;

                // Features
                incrementCount("Gender", values[0], status);
                incrementCount("Married", values[1], status);
                incrementCount("Dependents", values[2], status);
                incrementCount("Education", values[3], status);
                incrementCount("Self_Employed", values[4], status);
                
                // Binning Income
                double income = Double.parseDouble(values[5]);
                String incomeBin = income < 3000 ? "low" : (income < 6000 ? "mid" : "high");
                incrementCount("Income", incomeBin, status);

                incrementCount("Credit_History", values[9], status);
                incrementCount("Property_Area", values[10], status);
            }
        } catch (Exception e) {
            System.err.println("Error training loan predictor: " + e.getMessage());
        }
    }

    private static void incrementCount(String feature, String value, int status) {
        String key = feature + "_" + value + "_" + (status == 1 ? "Y" : "N");
        counts.put(key, counts.getOrDefault(key, 0.0) + 1);
    }

    public static double predict(Map<String, String> profile) {
        double pYes = (double) totalYes / totalSamples;
        double pNo = (double) totalNo / totalSamples;

        for (Map.Entry<String, String> entry : profile.entrySet()) {
            pYes *= getFeatureProbability(entry.getKey(), entry.getValue(), 1);
            pNo *= getFeatureProbability(entry.getKey(), entry.getValue(), 0);
        }

        return pYes / (pYes + pNo);
    }

    private static double getFeatureProbability(String feature, String value, int status) {
        String key = feature + "_" + value + "_" + (status == 1 ? "Y" : "N");
        double count = counts.getOrDefault(key, 0.0);
        int total = (status == 1) ? totalYes : totalNo;
        // Laplace smoothing
        return (count + 1) / (total + 2.0);
    }
}
