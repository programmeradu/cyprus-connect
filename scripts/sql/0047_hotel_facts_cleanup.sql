-- Hotel facts are entered by the hotel only (scripts/sql/0047).
-- Remove rows the old pack created with invented defaults that nobody edited,
-- and clear the tour-operator names it filled in.
DELETE FROM hospitality_profiles
 WHERE created_at = updated_at
   AND total_rooms = 60 AND annual_occupied_rooms = 14000 AND annual_guest_nights = 28000;
UPDATE hospitality_profiles SET tour_operator_partners = NULL;
UPDATE hospitality_profiles SET eco_label = NULL WHERE eco_label = 'None';
