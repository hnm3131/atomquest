package com.atomquest.modules.export.service;

import com.atomquest.modules.achievement.entity.Achievement;
import com.atomquest.modules.achievement.repository.AchievementRepository;
import com.atomquest.modules.goal.entity.Goal;
import com.atomquest.modules.goal.entity.GoalSheet;
import com.atomquest.modules.goal.repository.GoalRepository;
import com.atomquest.modules.goal.repository.GoalSheetRepository;
import com.atomquest.modules.user.entity.User;
import com.atomquest.modules.user.repository.UserRepository;
import com.atomquest.shared.enums.GoalSheetStatus;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.StringWriter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final GoalSheetRepository goalSheetRepository;
    private final GoalRepository goalRepository;
    private final AchievementRepository achievementRepository;
    private final UserRepository userRepository;

    public byte[] exportToExcel() throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Achievements");
            
            // Header
            Row headerRow = sheet.createRow(0);
            String[] columns = {"Employee", "Department", "Thrust Area", "Goal Title", "UoM", "Target", "Weightage", "Q1 Actual", "Q1 Score", "Q2 Actual", "Q2 Score"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
            }

            // Data
            List<GoalSheet> lockedSheets = goalSheetRepository.findByStatus(GoalSheetStatus.LOCKED);
            int rowIdx = 1;
            for (GoalSheet gs : lockedSheets) {
                User user = userRepository.findById(gs.getEmployeeId()).orElse(null);
                String empName = user != null ? user.getName() : "Unknown";
                String dept = user != null ? user.getDepartment() : "Unknown";

                List<Goal> goals = goalRepository.findByGoalSheetId(gs.getId());
                for (Goal goal : goals) {
                    Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(empName);
                    row.createCell(1).setCellValue(dept);
                    row.createCell(2).setCellValue(goal.getThrustArea());
                    row.createCell(3).setCellValue(goal.getTitle());
                    row.createCell(4).setCellValue(goal.getUomType().name());
                    row.createCell(5).setCellValue(goal.getTargetValue() != null ? goal.getTargetValue().toString() : (goal.getTargetDate() != null ? goal.getTargetDate().toString() : ""));
                    row.createCell(6).setCellValue(goal.getWeightage());

                    List<Achievement> achs = achievementRepository.findByGoalId(goal.getId());
                    Map<String, Achievement> achMap = achs.stream().collect(Collectors.toMap(a -> a.getQuarter().name(), a -> a));
                    
                    Achievement q1 = achMap.get("Q1");
                    row.createCell(7).setCellValue(q1 != null && q1.getActualValue() != null ? q1.getActualValue().toString() : "");
                    row.createCell(8).setCellValue(q1 != null && q1.getComputedScore() != null ? q1.getComputedScore().toString() : "");
                    
                    Achievement q2 = achMap.get("Q2");
                    row.createCell(9).setCellValue(q2 != null && q2.getActualValue() != null ? q2.getActualValue().toString() : "");
                    row.createCell(10).setCellValue(q2 != null && q2.getComputedScore() != null ? q2.getComputedScore().toString() : "");
                }
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public String exportToCsv() throws Exception {
        StringWriter sw = new StringWriter();
        try (CSVWriter writer = new CSVWriter(sw)) {
            String[] header = {"Employee", "Department", "Thrust Area", "Goal Title", "UoM", "Target", "Weightage", "Q1 Actual", "Q1 Score"};
            writer.writeNext(header);

            List<GoalSheet> lockedSheets = goalSheetRepository.findByStatus(GoalSheetStatus.LOCKED);
            for (GoalSheet gs : lockedSheets) {
                User user = userRepository.findById(gs.getEmployeeId()).orElse(null);
                String empName = user != null ? user.getName() : "Unknown";
                String dept = user != null ? user.getDepartment() : "Unknown";

                List<Goal> goals = goalRepository.findByGoalSheetId(gs.getId());
                for (Goal goal : goals) {
                    List<Achievement> achs = achievementRepository.findByGoalId(goal.getId());
                    Achievement q1 = achs.stream().filter(a -> a.getQuarter().name().equals("Q1")).findFirst().orElse(null);

                    String target = goal.getTargetValue() != null ? goal.getTargetValue().toString() : (goal.getTargetDate() != null ? goal.getTargetDate().toString() : "");
                    String q1Act = q1 != null && q1.getActualValue() != null ? q1.getActualValue().toString() : "";
                    String q1Score = q1 != null && q1.getComputedScore() != null ? q1.getComputedScore().toString() : "";

                    writer.writeNext(new String[]{
                            empName, dept, goal.getThrustArea(), goal.getTitle(), goal.getUomType().name(),
                            target, String.valueOf(goal.getWeightage()), q1Act, q1Score
                    });
                }
            }
        }
        return sw.toString();
    }
}
