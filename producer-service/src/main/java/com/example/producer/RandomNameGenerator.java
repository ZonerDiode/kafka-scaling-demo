package com.example.producer;

import java.util.Random;

/**
 * Creates random names from a set list.
 */
public class RandomNameGenerator {

    private RandomNameGenerator() {
        throw new IllegalStateException("This is a utility class and cannot be instantiated");
    }
    
    /**
     * Picks a random name from a predefined set of first and last names.
     * @return Randomly generated name.
     */
    public static String generateName() {

        return String.format("%s %s", 
                firstNames[rnd.nextInt(firstNames.length)], 
                lastNames[rnd.nextInt(lastNames.length)]);
    }

    private static final Random rnd = new Random();
    
    private static final String[] firstNames = {
            "Alice", "Bob", "Charlie", "Diana", "Ethan",
            "Fiona", "George", "Hannah", "Ian", "Julia",
            "Kevin", "Linda", "Mark", "Nancy", "Olivia",
            "Paul", "Quinn", "Rachel", "Steve", "Tina",
            "Ursula", "Victor", "Wendy", "Xavier", "Yvonne",
            "Zoe", "Aaron", "Bella", "Caleb", "Daisy",
            "Ella", "Felix", "Gina", "Henry", "Isabella",
            "Jack", "Kylie", "Liam", "Mia", "Noah",
            "Oliver", "Parker", "Quincy", "Riley", "Sophia",
            "Taylor", "Ulysses", "Victoria", "William", "Xena",
            "Yasmine", "Zachary", "Abigail", "Benjamin", "Catherine",
            "David", "Evelyn", "Frank", "Gloria", "Harper",
            "Isaac", "Jasmine", "Katherine", "Leo", "Maggie",
            "Nathan", "Jewel", "Preston", "Quinton", "Rosa",
            "Samuel", "Tessa", "Umar", "Sky", "Walter",
            "Xiomara", "Yuri", "Zane", "Aiden", "Brianna",
            "Cameron", "Drew", "Eli", "Faye", "Gabriel",
            "Hazel", "Ian", "Julian", "Kara", "Landon",
            "Maddie", "Nolan", "Olive", "Piper", "Quincy",
            "Riley", "Samantha", "Tatum", "Ulysses", "Lacy",
            "Wesley", "Xena", "Yasmine", "Zane", "Abigail",
            "Benjamin", "Catherine", "David", "Evelyn", "Frank",
            "Gloria", "Harper", "Isaac", "Jasmine", "Katherine",
            "Leo", "Maggie", "Nathan", "Brian", "Preston",
            "Quinton", "Rosa", "Samuel", "Tessa", "Umar",
            "Sean", "Walter", "Xiomara", "Yuri", "Zane"
    };

    private static final String[] lastNames = {
            "Smith", "Johnson", "Williams", "Brown", "Jones",
            "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
            "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
            "Thomas", "Taylor", "Moore", "Jackson", "Martin",
            "Lee", "Perez", "Thompson", "White", "Harris",
            "Clark", "Lewis", "Robinson", "Walker", "Young"
    };
}
