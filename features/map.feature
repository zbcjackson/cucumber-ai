Feature: Search for a location on the map

  Scenario: Search for a location
    When I search for "百度研发中心"
    Then I should see the address "上海市浦东新区纳贤路701号"
