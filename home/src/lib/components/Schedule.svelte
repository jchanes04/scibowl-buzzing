<script lang="ts">

</script>

<div class="schedule">
    <table>
        <tr>
            <th>Event</th>
            <th>Time</th>
        </tr>
        <tr>
            <td>Opening Ceremony</td>
            <td>8:45 - 9:00</td>
        </tr>
        <tr>
            <td>Round Robin 1</td>
            <td>9:05 - 9:50</td>
        </tr>
        <tr>
            <td>Round Robin 2</td>
            <td>9:55 - 10:40</td>
        </tr>
        <tr>
            <td>Round Robin 3</td>
            <td>10:45 - 11:30</td>
        </tr>
        <tr>
            <td>Round Robin 4</td>
            <td>11:35 - 12:20</td>
        </tr>
        <tr>
            <td>Round Robin 5</td>
            <td>12:25 - 1:10</td>
        </tr>
        <tr>
            <td>Seeding Round</td>
            <td>1:15 - 1:35</td>
        </tr>
        <tr>
            <td>Lunch</td>
            <td>1:35 - 2:15</td>
        </tr>
    </table>
    <table>
        <tr>
            <th>Event</th>
            <th>Time</th>
        </tr>
        <tr>
            <td>DE 6</td>
            <td>2:20 - 2:55</td>
        </tr>
        <tr>
            <td>DE 7</td>
            <td>3:00 - 3:35</td>
        </tr>
        <tr>
            <td>DE 8</td>
            <td>3:40 - 4:15</td>
        </tr>
        <tr>
            <td>DE 9</td>
            <td>4:20 - 4:55</td>
        </tr>
        <tr>
            <td>DE 10</td>
            <td>5:00 - 5:35</td>
        </tr>
        <tr>
            <td>DE 11 (Semifinals)</td>
            <td>5:40 - 6:15</td>
        </tr>
        <tr>
            <td>DE 12 (Finals)</td>
            <td>6:20 - 6:55</td>
        </tr>
        <tr>
            <td>Closing and Awards</td>
            <td>7:05 - 7:20</td>
        </tr>
    </table>
</div>

<style lang="scss">
    .schedule {
        display: flex;
        flex-direction: row;
        gap: 40px;
        flex-wrap: wrap;
        max-width: 90vw;
        margin: auto;
        justify-content: center;
    }

    table, th, td {
        border: 1px solid black;
        border-collapse: collapse;
    }

    th {
        font-weight: bold;
        padding: 0.3em 0.6em;
        font-size: 22px;
    }

    td {
        padding: 0.3em 0.6em;
        font-size: 18px;
    }
</style>