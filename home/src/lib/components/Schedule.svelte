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
            <td>9:10 - 9:25</td>
        </tr>
        <tr>
            <td>Round Robin 1</td>
            <td>9:30 - 10:10</td>
        </tr>
        <tr>
            <td>Round Robin 2</td>
            <td>10:15 - 10:55</td>
        </tr>
        <tr>
            <td>Round Robin 3</td>
            <td>11:00 - 11:40</td>
        </tr>
        <tr>
            <td>Round Robin 4</td>
            <td>11:45 - 12:25</td>
        </tr>
        <tr>
            <td>Round Robin 5</td>
            <td>12:30 - 1:10</td>
        </tr>
        <tr>
            <td>Seeding Round</td>
            <td>1:15 - 1:40</td>
        </tr>
        <tr>
            <td>Lunch</td>
            <td>1:40 - 2:40</td>
        </tr>
    </table>
    <table>
        <tr>
            <th>Event</th>
            <th>Time</th>
        </tr>
        <tr>
            <td>DE 6</td>
            <td>2:45 - 3:20</td>
        </tr>
        <tr>
            <td>DE 7</td>
            <td>3:25 - 4:00</td>
        </tr>
        <tr>
            <td>DE 8</td>
            <td>4:05 - 4:40</td>
        </tr>
        <tr>
            <td>DE 9</td>
            <td>4:45 - 5:20</td>
        </tr>
        <tr>
            <td>DE 10</td>
            <td>5:25 - 6:00</td>
        </tr>
        <tr>
            <td>DE 11 (Semifinals)</td>
            <td>6:05 - 6:40</td>
        </tr>
        <tr>
            <td>DE 12 (Finals)</td>
            <td>6:45 - 7:20</td>
        </tr>
        <tr>
            <td>Closing and Awards</td>
            <td>7:30 - 7:45</td>
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